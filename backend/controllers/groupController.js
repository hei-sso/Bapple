import db from '../db.js';
import crypto from 'crypto';

// 랜덤 초대 코드 생성 (6자리)
const generateInviteCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// 1. 그룹 생성
export const createGroup = async (req, res) => {
  const connection = await db.getConnection();
  const { name, description, type } = req.body; // type: 'SHARED' or 'PEEK'
  const userId = req.user.id; 

  try {
    await connection.beginTransaction();
    const inviteCode = generateInviteCode();

    // 그룹 생성
    const [groupResult] = await connection.query(
      `INSERT INTO user_group (name, description, owner_user_id, invite_code, group_type, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, description, userId, inviteCode, type]
    );
    const newGroupId = groupResult.insertId;

    // 방장 멤버 추가
    await connection.query(
      `INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, 'OWNER')`,
      [newGroupId, userId]
    );

    await connection.commit();
    res.status(201).json({ success: true, groupId: newGroupId, inviteCode, type });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: '그룹 생성 실패' });
  } finally {
    connection.release();
  }
};

// 2. 초대 코드로 입장 (제일 중요!)
export const joinGroup = async (req, res) => {
  const connection = await db.getConnection();
  const { inviteCode } = req.body;
  const userId = req.user.id;

  try {
    await connection.beginTransaction();

    // 코드 확인
    const [groups] = await connection.query(
      'SELECT group_id, name, owner_user_id, group_type FROM user_group WHERE invite_code = ?', 
      [inviteCode]
    );
    if (groups.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '유효하지 않은 코드' });
    }
    const group = groups[0];

    // 중복 가입 방지
    const [exists] = await connection.query(
      'SELECT 1 FROM group_member WHERE group_id = ? AND user_id = ?', 
      [group.group_id, userId]
    );
    if (exists.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: '이미 가입된 그룹' });
    }

    // 멤버 추가
    await connection.query(
      `INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, 'MEMBER')`,
      [group.group_id, userId]
    );

    // 로직 핵심: 공유형(SHARED)이면 방장 냉장고 권한을 줌
    if (group.group_type === 'SHARED') {
      const [fridge] = await connection.query(
        'SELECT id FROM fridge WHERE owner_user_id = ? AND is_default = 1',
        [group.owner_user_id]
      );
      if (fridge.length > 0) {
        await connection.query(
          `INSERT INTO fridge_share (fridge_id, user_id, role) VALUES (?, ?, 'editor')`,
          [fridge[0].id, userId]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: '그룹 가입 완료' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: '가입 실패' });
  } finally {
    connection.release();
  }
};

// 3. 멤버 목록 조회
export const getMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [members] = await db.query(`
      SELECT gm.user_id, gm.role, gm.joined_at, u.nickname, u.profile_image
      FROM group_member gm
      JOIN user u ON gm.user_id = u.user_id
      WHERE gm.group_id = ?
    `, [groupId]);
    
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ message: '목록 조회 실패' });
  }
};