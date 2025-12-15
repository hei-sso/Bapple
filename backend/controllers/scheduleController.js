import db from '../db.js';

// 1. 내 전체 식단(개인 + 내가 속한 그룹) 조회 (GET /schedule/my)
export const getMySchedules = async (req, res) => {
    const userId = req.user.user_id || req.user.id; 
    const { week_start_date } = req.query;

    if (!week_start_date) {
        return res.status(400).json({ success: false, message: "시작 날짜가 필요합니다." });
    }

    try {
        const startDate = new Date(week_start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // 1. 쿼리에서 'AS'를 써서 변수명을 미리 카멜케이스로 바꿉니다.
        const query = `
            SELECT 
                mp.meal_plan_id AS id,           -- schedule_id -> id
                DATE_FORMAT(mp.plan_date, '%Y-%m-%d') AS date,
                mp.meal_type AS mealType,
                mp.recipe_id AS recipeId,        -- recipe_id -> recipeId
                
                r.name AS recipeName,            -- recipe_name -> recipeName
                r.img_url AS recipeImageUrl,     -- 일치함

                mp.group_id AS groupId,          -- group_id -> groupId (핵심!)
                g.name AS groupName,             
                
                mp.title AS planTitle,
                mp.memo
            FROM meal_plan mp
            LEFT JOIN recipe r ON mp.recipe_id = r.recipe_id
            LEFT JOIN user_group g ON mp.group_id = g.group_id
            WHERE 
                (
                    (mp.user_id = ? AND mp.group_id IS NULL) 
                    OR 
                    mp.group_id IN (
                        SELECT group_id FROM group_member WHERE user_id = ? 
                    )
                )
                AND mp.plan_date BETWEEN ? AND ?
            ORDER BY mp.plan_date ASC, mp.meal_type ASC;
        `;

        const [rows] = await db.query(query, [userId, userId, startStr, endStr]);

        // 2. [중요] Flat한 DB 데이터를 프론트엔드가 원하는 "날짜별 그룹핑" 구조로 변환
        // 프론트엔드 detail.tsx가 날짜 키(date) 하나에 recipes 배열을 기대하기 때문입니다.
        const groupedData = rows.reduce((acc, row) => {
            const dateKey = row.date;
            
            // 해당 날짜가 처음이면 초기화
            if (!acc[dateKey]) {
                acc[dateKey] = {
                    date: dateKey,
                    recipes: [] 
                };
            }

            // 레시피 정보만 따로 빼서 배열에 push
            acc[dateKey].recipes.push({
                id: row.id,             // 식단 PK
                recipeId: row.recipeId, // 레시피 ID
                recipeName: row.recipeName,
                recipeImageUrl: row.recipeImageUrl,
                groupId: row.groupId,
                groupName: row.groupName,
                mealType: row.mealType,
                title: row.planTitle,
                memo: row.memo
            });

            return acc;
        }, {});

        // 객체를 다시 배열로 변환 (Object.values)
        const responseData = Object.values(groupedData);

        res.status(200).json({
            success: true,
            data: responseData // 변환된 데이터를 전송
        });

    } catch (error) {
        console.error("스케줄 조회 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    }
};
// 2. 식단 추가 (POST /schedule) - 수정됨!
export const addSchedule = async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    // [디버깅 로그]
    console.log("📥 [POST] 식단 추가 요청 Body:", req.body);

    // 1. 변수명 방어 로직
    const recipe_id = req.body.recipe_id || req.body.recipeId;
    const schedule_date = req.body.schedule_date || req.body.date;
    const group_id = req.body.group_id || req.body.groupId;
    
    // 기본값 처리
    const meal_type = req.body.meal_type || 'LUNCH';
    const title = req.body.title || null;
    const memo = req.body.memo || null;

    // 🚨 [필수 수정] 날짜 체크
    if (!schedule_date) {
        return res.status(400).json({ success: false, message: "날짜 정보가 누락되었습니다." });
    }

    // 🚨 [필수 수정] 레시피 ID 체크 (여기서 NULL을 막습니다!)
    if (!recipe_id) {
        console.error("❌ 레시피 ID 누락됨");
        return res.status(400).json({ success: false, message: "레시피 ID가 필요합니다." });
    }

    try {
        const targetGroupId = (group_id === 'personal' || !group_id) ? null : group_id;
        
        // 레시피 이름 가져오기 (데이터 무결성 체크 겸용)
        // recipe 테이블이 있다면 이름을 가져와서 저장하는 것이 좋습니다.
        let recipeName = 'Unknown Recipe';
        try {
             const [rows] = await db.query('SELECT name FROM recipe WHERE recipe_id = ?', [recipe_id]);
             if (rows.length > 0) recipeName = rows[0].name;
        } catch (e) { console.log("레시피 조회 패스"); }

        const insertQuery = `
            INSERT INTO meal_plan (user_id, group_id, recipe_id, plan_date, meal_type, title, memo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            userId, 
            targetGroupId, 
            recipe_id,  // 👈 여기에 || null 을 지웠습니다. 무조건 값이 들어갑니다.
            schedule_date, 
            meal_type, 
            title || recipeName, // 제목이 없으면 레시피 이름 사용
            memo
        ]);

        console.log(`식단 추가 완료! ID: ${result.insertId}, Recipe: ${recipe_id}`);

        const newSchedule = {
            schedule_id: result.insertId.toString(),
            date: schedule_date,
            recipe_id,
            group_id: targetGroupId,
            meal_type
        };

        res.status(201).json({
            success: true,
            message: "식단이 추가되었습니다.",
            data: newSchedule
        });

    } catch (error) {
        console.error("식단 추가 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생: " + error.message });
    }
};

// 3. 식단 삭제 (DELETE /schedule/:scheduleId)
export const deleteSchedule = async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const { scheduleId } = req.params;

    try {
        const deleteQuery = `
            DELETE FROM meal_plan 
            WHERE meal_plan_id = ? AND user_id = ?
        `;

        const [result] = await db.query(deleteQuery, [scheduleId, userId]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "삭제 권한이 없거나 이미 삭제된 식단입니다." 
            });
        }

        res.status(200).json({
            success: true,
            message: "식단이 삭제되었습니다."
        });

    } catch (error) {
        console.error("식단 삭제 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    }
};
