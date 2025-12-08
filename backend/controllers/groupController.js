// backend/controllers/groupController.js

import pool from '../db.js';
import crypto from 'crypto';

// 초대 코드 생성 헬퍼 함수
const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 예: 8A1B2C3D
};

const groupController = {
    // 1. 내 그룹 목록 조회 (GET /groups/my)
    getMyGroups: async (req, res) => {
      const userId = req.user.id || req.user.user_id;

      // 확인용 (필요 없으면 삭제)
      if (!userId) {
        console.error(" User ID not found in token:", req.user);
      return res.status(401).json({ success: false, message: "인증 실패" });
      }

        try {
            // user_group과 group_member 조인
            const query = `
                SELECT 
                    g.group_id,
                    g.name,
                    g.description,
                    g.owner_user_id,
                    g.invite_code,
                    g.group_image_url,
                    g.is_fridge_shared,
                    g.created_at,
                    gm.is_pinned,
                    (SELECT COUNT(*) FROM group_member WHERE group_id = g.group_id) as member_count
                FROM user_group g
                JOIN group_member gm ON g.group_id = gm.group_id
                WHERE gm.user_id = ?
                ORDER BY gm.is_pinned DESC, g.created_at DESC
            `;
            
            const [rows] = await pool.query(query, [userId]);

            // DB 컬럼(snake_case) -> 프론트엔드 타입(camelCase) 변환
            const formattedGroups = rows.map(row => ({
                id: row.group_id.toString(),
                name: row.name,
                description: row.description || '',
                ownerId: row.owner_user_id.toString(),
                inviteCode: row.invite_code,
                settings: { 
                    // DB 컬럼 값을 그대로 사용 ('all' or 'owner_only')
                    isFridgeShared: row.is_fridge_shared || 'owner_only' 
                },
                memberCount: row.member_count,
                maxMembers: 10,
                isPinned: !!row.is_pinned,
                imageUri: row.group_image_url || 'NULL',
                createdAt: row.created_at
            }));

            res.json({ success: true, data: formattedGroups });
        } catch (error) {
            console.error(' 그룹 조회 실패:', error);
            res.status(500).json({ success: false, message: '서버 오류 발생' });
        }
    },

    // 2. 그룹 생성 (POST /groups)
    createGroup: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }
        // GroupCreationModal.tsx에서 보내주는 데이터
        const { name, description, isFridgeShared } = req.body;
        
        // 초대 코드 생성
        const inviteCode = generateInviteCode();

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. 그룹 생성 (user_group)
            // visibility는 텍스트 파일 기준 ENUM('PRIVATE', 'INVITE_ONLY'...)
            // 여기서는 기본값 'PRIVATE'으로 설정하거나 'INVITE_ONLY'로 설정
            const [groupResult] = await connection.query(
                `INSERT INTO user_group 
                (name, description, owner_user_id, invite_code, is_fridge_shared, visibility, created_at) 
                VALUES (?, ?, ?, ?, ?, 'PRIVATE', NOW())`,
                [name, description, userId, inviteCode, isFridgeShared || 'owner_only']
            );
            const newGroupId = groupResult.insertId;

            // B. 멤버(방장) Insert (group_member)
            // role은 ENUM('OWNER', 'MEMBER'...)
            await connection.query(
                `INSERT INTO group_member (group_id, user_id, role, joined_at, is_pinned) 
                 VALUES (?, ?, 'OWNER', NOW(), 0)`,
                [newGroupId, userId]
            );

            await connection.commit();

            // C. 응답 데이터 구성
            const newGroupData = {
                id: newGroupId.toString(),
                name,
                description,
                ownerId: userId.toString(),
                inviteCode,
                settings: { isFridgeShared: isFridgeShared || 'owner_only' },
                memberCount: 1,
                maxMembers: 10,
                isPinned: false,
                imageUri: 'NULL',
                createdAt: new Date().toISOString()
            };

            res.json({ success: true, data: newGroupData });
        } catch (error) {
            await connection.rollback();
            console.error(' 그룹 생성 실패:', error);
            res.status(500).json({ success: false, message: '그룹 생성 실패' });
        } finally {
            connection.release();
        }
    },

    // 3. 그룹 가입 (POST /groups/join)
    joinGroup: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }

        const { invite_code } = req.body;

        try {
            const [groups] = await pool.query('SELECT * FROM user_group WHERE invite_code = ?', [invite_code]);
            if (groups.length === 0) {
                return res.status(404).json({ success: false, message: '유효하지 않은 초대 코드입니다.' });
            }
            const group = groups[0];

            const [members] = await pool.query(
                'SELECT * FROM group_member WHERE group_id = ? AND user_id = ?',
                [group.group_id, userId]
            );
            if (members.length > 0) {
                return res.status(400).json({ success: false, message: '이미 가입된 그룹입니다.' });
            }

            // role: 'MEMBER'
            await pool.query(
                `INSERT INTO group_member (group_id, user_id, role, joined_at, is_pinned) 
                 VALUES (?, ?, 'MEMBER', NOW(), 0)`,
                [group.group_id, userId]
            );

            const joinedGroupData = {
                id: group.group_id.toString(),
                name: group.name,
                description: group.description,
                ownerId: group.owner_user_id.toString(),
                inviteCode: group.invite_code,
                settings: { isFridgeShared: group.is_fridge_shared || 'owner_only' },
                memberCount: 1, 
                maxMembers: 10,
                isPinned: false,
                imageUri: group.group_image_url || 'NULL',
                createdAt: group.created_at
            };

            res.json({ success: true, data: joinedGroupData });
        } catch (error) {
            console.error('그룹 가입 실패:', error);
            res.status(500).json({ success: false, message: '그룹 가입 실패' });
        }
    },

    // 4. 핀 고정 토글 (PATCH /groups/:groupId/pin)
    togglePin: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }

        const { groupId } = req.params;

        try {
            await pool.query(
                `UPDATE group_member SET is_pinned = NOT is_pinned 
                 WHERE group_id = ? AND user_id = ?`,
                [groupId, userId]
            );
            res.json({ success: true });
        } catch (error) {
            console.error('핀 토글 실패:', error);
            res.status(500).json({ success: false, message: '핀 설정 실패' });
        }
    },

    // 5. 식단 추가 (POST /schedule)
    addSchedule: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }

        // recipeAPI.ts에서 보내주는 데이터
        const { recipeId, date, groupId } = req.body;

        // 'personal'이면 NULL, 아니면 groupId
        const finalGroupId = (groupId === 'personal' || !groupId) ? null : groupId;

        try {
            let recipeName = '나의 레시피';
            try {
                // recipe 테이블 (recipe_id가 PK라고 가정)
                const [recipes] = await pool.query('SELECT name FROM recipe WHERE recipe_id = ?', [recipeId]);
                if (recipes.length > 0) recipeName = recipes[0].name;
            } catch (e) {
                console.warn('⚠️ Recipe 테이블 조회 실패:', e.message);
            }

            // [중요] meal_plan 테이블의 meal_type은 NOT NULL입니다.
            // 현재 프론트엔드 UI에는 끼니 선택(아침/점심/저녁)이 없으므로, 기본값 'DINNER'를 설정합니다.
            // 추후 프론트엔드 업데이트 시 req.body.mealType 등으로 받아야 합니다.
            const [result] = await pool.query(
                `INSERT INTO meal_plan 
                (user_id, recipe_id, plan_date, group_id, title, meal_type, created_at)
                VALUES (?, ?, ?, ?, ?, 'DINNER', NOW())`,
                [userId, recipeId, date, finalGroupId, recipeName]
            );

            // 프론트엔드 응답 (GroupRecipeItem 형태)
            // id 값은 meal_plan_id (Auto Increment)
            res.json({
                success: true,
                data: {
                    id: result.insertId.toString(), 
                    recipeName: recipeName,
                    groupId: finalGroupId,
                    memberId: userId.toString(),
                    rating: 0, 
                    cookTimeMinutes: 0
                }
            });
        } catch (error) {
            console.error('식단 추가 실패:', error);
            res.status(500).json({ success: false, message: '식단 추가 실패' });
        }
    },

    // 6. 주간 스케줄 조회 (GET /schedule/my)
    getMySchedules: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }

        const { week_start_date } = req.query;

        try {
            // meal_plan 테이블 기준 조회 (PK: meal_plan_id)
            const query = `
                SELECT 
                    mp.meal_plan_id, 
                    DATE_FORMAT(mp.plan_date, '%Y-%m-%d') as plan_date_str, 
                    mp.group_id, 
                    mp.user_id,
                    mp.title,
                    mp.meal_type,
                    r.name as recipe_name,
                    r.rating,
                    r.time as cook_time
                FROM meal_plan mp
                LEFT JOIN recipe r ON mp.recipe_id = r.recipe_id
                LEFT JOIN group_member gm ON mp.group_id = gm.group_id AND gm.user_id = ?
                WHERE 
                    (mp.user_id = ? AND mp.group_id IS NULL) -- 개인 식단
                    OR 
                    (gm.user_id IS NOT NULL) -- 내가 속한 그룹의 식단
                ORDER BY mp.plan_date ASC
            `;

            const [rows] = await pool.query(query, [userId, userId]);

            // DB 결과(Flat) -> 프론트엔드 구조(Nested Date Key)로 변환
            const groupedSchedules = rows.reduce((acc, row) => {
                const dateKey = row.plan_date_str;
                
                let dayGroup = acc.find(item => item.date === dateKey);
                if (!dayGroup) {
                    dayGroup = { date: dateKey, recipes: [] };
                    acc.push(dayGroup);
                }

                dayGroup.recipes.push({
                    id: row.meal_plan_id.toString(), // PK 매핑
                    recipeName: row.recipe_name || row.title || '알 수 없는 레시피',
                    groupId: row.group_id ? row.group_id.toString() : null,
                    memberId: row.user_id.toString(),
                    rating: row.rating || 0,
                    cookTimeMinutes: row.cook_time || 0
                });

                return acc;
            }, []);

            res.json({ success: true, data: groupedSchedules });
        } catch (error) {
            console.error('스케줄 조회 실패:', error);
            res.status(500).json({ success: false, message: '스케줄 로드 실패' });
        }
    },

    // 7. 식단 삭제 (DELETE /schedule/:scheduleId)
    deleteSchedule: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        // 확인용 (필요 없으면 삭제)
        if (!userId) {
          console.error(" User ID not found in token:", req.user);
        return res.status(401).json({ success: false, message: "인증 실패" });
        }

        const { scheduleId } = req.params;

        try {
            // meal_plan 테이블의 PK는 meal_plan_id 입니다.
            const [result] = await pool.query(
                'DELETE FROM meal_plan WHERE meal_plan_id = ? AND user_id = ?',
                [scheduleId, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(403).json({ success: false, message: '삭제 권한이 없거나 식단이 존재하지 않습니다.' });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('식단 삭제 실패:', error);
            res.status(500).json({ success: false, message: '삭제 실패' });
        }
    }
};

export default groupController;