import pool from '../db.js';
import crypto from 'crypto';

// 1. 초대 코드 생성 헬퍼 함수 (그룹 ID 생성)
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
                id: row.group_id,              
                name: row.name,
                description: row.description || '',
                ownerId: row.owner_user_id.toString(),
                inviteCode: row.group_id,      
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
        
        const newGroupId = generateGroupId(); 

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. 그룹 생성
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
                id: newGroupId,                
                name,
                description,
                ownerId: userId.toString(),
                inviteCode: newGroupId,        
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

        const { invite_code } = req.body; 

        try {
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
                inviteCode: group.group_id, 
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
        const { groupId } = req.params;

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

        const recipeId = req.body.recipe_id || req.body.recipeId;
        const date = req.body.schedule_date || req.body.date;
        const groupId = req.body.group_id || req.body.groupId;
        
        const meal_type = req.body.meal_type || 'LUNCH';
        const title = req.body.title || null;
        const memo = req.body.memo || null;

        if (!date) {
            return res.status(400).json({ success: false, message: "날짜 정보가 누락되었습니다." });
        }

        // 🚨 [필수 수정] 레시피 ID 체크 (NULL 방지)
        if (!recipeId) {
            console.error("❌ [식단 추가 실패] 레시피 ID 누락");
            return res.status(400).json({ 
                success: false, 
                message: "레시피 ID는 필수입니다. 레시피를 선택해주세요." 
            });
        }

        const finalGroupId = (groupId === 'personal' || !groupId) ? null : groupId;

        try {
            // 레시피 이름 조회
            let recipeName = 'Unknown Recipe';
            try {
                const [recipes] = await pool.query('SELECT name FROM recipe WHERE recipe_id = ?', [recipeId]);
                if (recipes.length > 0) recipeName = recipes[0].name;
            } catch (e) { /* 조회 실패해도 진행 */ }

            // 4. 식단 저장
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
            // ⭐ [핵심 수정] SELECT 절에 mp.recipe_id 추가!
            const query = `
                SELECT 
                    mp.meal_plan_id, 
                    DATE_FORMAT(mp.plan_date, '%Y-%m-%d') as plan_date_str, 
                    mp.group_id, 
                    mp.user_id,
                    mp.title,
                    mp.meal_type,
                    mp.recipe_id,  -- 👈 이거 없으면 프론트에서 NULL로 뜸!
                    r.name as recipe_name,
                    r.cooking_time as cook_time 
                FROM meal_plan mp
                LEFT JOIN recipe r ON mp.recipe_id = r.recipe_id
                LEFT JOIN group_member gm ON mp.group_id = gm.group_id AND gm.user_id = ?
                WHERE 
                    (mp.user_id = ? AND mp.group_id IS NULL) 
                    OR 
                    (gm.user_id IS NOT NULL)
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
                    groupId: row.group_id, 
                    
                    // ⭐ [핵심 수정] 응답 객체에 recipeId 포함!
                    recipeId: row.recipe_id ? row.recipe_id.toString() : null, 
                    
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
        const { scheduleId } = req.params;

        if (!userId) return res.status(401).json({ success: false, message: "인증 실패" });

        try {
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
