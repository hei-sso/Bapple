import pool from '../db.js';
import crypto from 'crypto';

// 1. 초대 코드 생성 헬퍼 함수 (이제 이게 그룹 ID가 됩니다)
// CHAR(8)에 딱 맞게 4바이트(8글자) 16진수 생성
const generateGroupId = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 예: 8A1B2C3D
};

const groupController = {
    // 1. 내 그룹 목록 조회 (GET /groups/my)
    getMyGroups: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "인증 실패" });
        }

        try {
            // [수정] g.invite_code 컬럼 삭제됨 -> g.group_id가 곧 초대코드임
            const query = `
                SELECT 
                    g.group_id,
                    g.name,
                    g.description,
                    g.owner_user_id,
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

            const formattedGroups = rows.map(row => ({
                id: row.group_id,              // CHAR(8) 문자열
                name: row.name,
                description: row.description || '',
                ownerId: row.owner_user_id.toString(),
                inviteCode: row.group_id,      // [중요] ID가 곧 초대코드
                settings: { 
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
            console.error('그룹 조회 실패:', error);
            res.status(500).json({ success: false, message: '서버 오류 발생' });
        }
    },

    // 2. 그룹 생성 (POST /groups)
    createGroup: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "인증 실패" });
        }

        const { name, description, isFridgeShared } = req.body;
        
        // [수정] 여기서 생성한 코드가 곧 PK(group_id)가 됨
        const newGroupId = generateGroupId(); 

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. 그룹 생성 (invite_code 컬럼 제거, group_id에 값 직접 삽입)
            await connection.query(
                `INSERT INTO user_group 
                (group_id, name, description, owner_user_id, is_fridge_shared, visibility, created_at) 
                VALUES (?, ?, ?, ?, ?, 'PRIVATE', NOW())`,
                [newGroupId, name, description, userId, isFridgeShared || 'owner_only']
            );

            // B. 멤버(방장) 추가
            await connection.query(
                `INSERT INTO group_member (group_id, user_id, role, joined_at, is_pinned) 
                 VALUES (?, ?, 'OWNER', NOW(), 0)`,
                [newGroupId, userId]
            );

            await connection.commit();

            const newGroupData = {
                id: newGroupId,                // 생성된 ID 반환
                name,
                description,
                ownerId: userId.toString(),
                inviteCode: newGroupId,        // 초대 코드도 동일
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
            
            // 만약 정말 운 나쁘게 중복된 ID가 생성되었다면 (희박함)
            if (error.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ success: false, message: '그룹 생성 중 충돌이 발생했습니다. 다시 시도해주세요.' });
            }

            console.error('그룹 생성 실패:', error);
            res.status(500).json({ success: false, message: '그룹 생성 실패', error: error.message });
        } finally {
            connection.release();
        }
    },

    // 3. 그룹 가입 (POST /groups/join)
    joinGroup: async (req, res) => {
        const userId = req.user.id || req.user.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "인증 실패" });
        }

        // 프론트에서 'invite_code'란 이름으로 보내주지만, 실제론 group_id임
        const { invite_code } = req.body; 

        try {
            // [수정] invite_code 컬럼이 없으므로 group_id로 검색
            const [groups] = await pool.query('SELECT * FROM user_group WHERE group_id = ?', [invite_code]);
            
            if (groups.length === 0) {
                return res.status(404).json({ success: false, message: '유효하지 않은 초대 코드(그룹 ID)입니다.' });
            }
            const group = groups[0];

            // 이미 가입했는지 체크
            const [members] = await pool.query(
                'SELECT * FROM group_member WHERE group_id = ? AND user_id = ?',
                [group.group_id, userId]
            );
            if (members.length > 0) {
                return res.status(400).json({ success: false, message: '이미 가입된 그룹입니다.' });
            }

            // 멤버 추가
            await pool.query(
                `INSERT INTO group_member (group_id, user_id, role, joined_at, is_pinned) 
                 VALUES (?, ?, 'MEMBER', NOW(), 0)`,
                [group.group_id, userId]
            );

            const joinedGroupData = {
                id: group.group_id,
                name: group.name,
                description: group.description,
                ownerId: group.owner_user_id.toString(),
                inviteCode: group.group_id, // ID 리턴
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
        const { groupId } = req.params; // 이제 문자열(CHAR 8)

        if (!userId) return res.status(401).json({ success: false, message: "인증 실패" });

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

        if (!userId) {
            return res.status(401).json({ success: false, message: "인증 실패" });
        }

        // 1. 데이터 받기 (변수명 방어 로직)
        const recipeId = req.body.recipe_id || req.body.recipeId;
        const date = req.body.schedule_date || req.body.date;
        const groupId = req.body.group_id || req.body.groupId;
        
        // 2. [중요] 필수값 검증 (여기서 막습니다!)
        if (!recipeId) {
            console.error("❌ [식단 추가 실패] 레시피 ID가 누락되었습니다.");
            return res.status(400).json({ 
                success: false, 
                message: "레시피 ID는 필수입니다. 레시피를 선택해주세요." 
            });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: "날짜 정보가 누락되었습니다." });
        }

        // 그룹 ID 처리 (문자열 'personal'이거나 없으면 NULL)
        const finalGroupId = (groupId === 'personal' || !groupId) ? null : groupId;

        try {
            // 3. 레시피 이름 조회 (DB에 존재하는지 확인 겸용)
            const [recipes] = await pool.query('SELECT name FROM recipe WHERE recipe_id = ?', [recipeId]);
            
            if (recipes.length === 0) {
                return res.status(404).json({ success: false, message: "존재하지 않는 레시피입니다." });
            }
            
            const recipeName = recipes[0].name;

            // 4. 식단 저장 (recipeId가 무조건 들어감)
            const [result] = await pool.query(
                `INSERT INTO meal_plan 
                (user_id, recipe_id, plan_date, group_id, title, meal_type, created_at)
                VALUES (?, ?, ?, ?, ?, 'DINNER', NOW())`,
                [userId, recipeId, date, finalGroupId, recipeName]
            );

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
            res.status(500).json({ success: false, message: '식단 추가 실패', error: error.message });
        }
    },

    // 6. 주간 스케줄 조회 (GET /schedule/my)
    getMySchedules: async (req, res) => {
        const userId = req.user.id || req.user.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "인증 실패" });

        try {
            const query = `
                SELECT 
                    mp.meal_plan_id, 
                    DATE_FORMAT(mp.plan_date, '%Y-%m-%d') as plan_date_str, 
                    mp.group_id, 
                    mp.user_id,
                    mp.title,
                    mp.meal_type,
                    r.name as recipe_name,
                    r.cooking_time as cook_time 
                FROM meal_plan mp
                LEFT JOIN recipe r ON mp.recipe_id = r.recipe_id
                -- 내가 속한 그룹인지 확인 (개인 식단이 아닌 경우)
                LEFT JOIN group_member gm ON mp.group_id = gm.group_id AND gm.user_id = ?
                WHERE 
                    (mp.user_id = ? AND mp.group_id IS NULL) -- 개인 식단
                    OR 
                    (gm.user_id IS NOT NULL) -- 내가 속한 그룹의 식단
                ORDER BY mp.plan_date ASC
            `;

            const [rows] = await pool.query(query, [userId, userId]);

            const groupedSchedules = rows.reduce((acc, row) => {
                const dateKey = row.plan_date_str;
                
                let dayGroup = acc.find(item => item.date === dateKey);
                if (!dayGroup) {
                    dayGroup = { date: dateKey, recipes: [] };
                    acc.push(dayGroup);
                }

                dayGroup.recipes.push({
                    id: row.meal_plan_id.toString(),
                    recipeName: row.recipe_name || row.title || '알 수 없는 레시피',
                    groupId: row.group_id, // CHAR(8) 문자열 그대로 반환
                    memberId: row.user_id.toString(),
                    rating: 0,
                    cookTimeMinutes: row.cook_time || 0
                });

                return acc;
            }, []);

            res.json({ success: true, data: groupedSchedules });
        } catch (error) {
            console.error('스케줄 조회 실패:', error);
            res.status(500).json({ success: false, message: '스케줄 로드 실패', error: error.message });
        }
    },

    // 7. 식단 삭제 (DELETE /schedule/:scheduleId)
    deleteSchedule: async (req, res) => {
        const userId = req.user.id || req.user.user_id;
        if (!userId) return res.status(401).json({ success: false, message: "인증 실패" });

        const { scheduleId } = req.params;

        try {
            // 본인이 작성한(user_id) 식단만 삭제 가능하도록 제한
            // (그룹 식단이어도 작성자만 지울 수 있게 할지, 그룹원이면 다 지울 수 있게 할지는 정책 나름.
            //  여기선 일단 '내 user_id로 등록된 식단'만 지우는 로직 유지)
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