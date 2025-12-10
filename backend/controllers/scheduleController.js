import db from '../db.js'; // DB 연결 설정

// 1. 내 전체 식단(개인 + 내가 속한 그룹) 조회 (GET /schedule/my)
export const getMySchedules = async (req, res) => {
    // authMiddleware에서 req.user.id (또는 user_id)를 세팅했다고 가정
    const userId = req.user.user_id || req.user.id; 
    const { week_start_date } = req.query;

    if (!week_start_date) {
        return res.status(400).json({ success: false, message: "시작 날짜가 필요합니다." });
    }

    try {
        // 주간 범위 계산 (시작일 ~ +6일)
        const startDate = new Date(week_start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // 쿼리 로직:
        // 1. 내 개인 식단 (mp.user_id = 나 AND mp.group_id IS NULL)
        // 2. 내가 속한 그룹의 식단 (mp.group_id IN (내가 멤버인 그룹들))
        // recipe 테이블과 조인하여 레시피 제목(title)을 가져옵니다.
        // user_group 테이블과 조인하여 그룹 이름(group_name)을 가져옵니다.
        
        const query = `
            SELECT 
                mp.meal_plan_id AS schedule_id,
                DATE_FORMAT(mp.plan_date, '%Y-%m-%d') AS date,
                mp.meal_type,
                mp.recipe_id,
                r.recipe_name AS recipe_name, -- recipe 테이블 컬럼명 확인 필요 (name vs title)
                mp.group_id,
                g.group_name AS group_name,   -- user_group 테이블 컬럼명 확인 필요
                mp.title AS plan_title,       -- 식단 자체의 제목 (있을 경우)
                mp.memo
            FROM meal_plan mp
            LEFT JOIN recipe r ON mp.recipe_id = r.recipe_id
            LEFT JOIN user_group g ON mp.group_id = g.group_id
            WHERE 
                (
                    (mp.user_id = ? AND mp.group_id IS NULL) 
                    OR 
                    mp.group_id IN (
                        SELECT group_id FROM user_group_member WHERE user_id = ? 
                        -- user_group_member 테이블이 있다고 가정 (그룹 멤버십 테이블)
                    )
                )
                AND mp.plan_date BETWEEN ? AND ?
            ORDER BY mp.plan_date ASC, mp.meal_type ASC;
        `;

        // user_group_member 테이블명은 실제 DB에 맞게 수정해주세요 (예: group_members 등)
        const [rows] = await db.query(query, [userId, userId, startStr, endStr]);

        res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("❌ 스케줄 조회 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    }
};

// 2. 식단 추가 (POST /schedule)
export const addSchedule = async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    // 프론트엔드 API에서 보내주는 필드: recipe_id, schedule_date, group_id
    // DB 필수 필드인 meal_type이 프론트에서 안 오면 기본값 'LUNCH' 사용
    const { recipe_id, schedule_date, group_id, meal_type = 'LUNCH', title, memo } = req.body;

    if (!schedule_date) {
        return res.status(400).json({ success: false, message: "날짜 정보가 누락되었습니다." });
    }

    try {
        // group_id가 'personal'이나 null로 오면 개인 식단
        const targetGroupId = (group_id === 'personal' || !group_id) ? null : group_id;
        
        // 개인 식단이면 user_id 필수, 그룹 식단이면 group_id 필수 (하지만 작성자 user_id는 남기는 게 좋음)
        // 스키마상 user_id는 NULL 허용이지만, 작성자 추적을 위해 넣는 것을 추천
        
        const insertQuery = `
            INSERT INTO meal_plan (user_id, group_id, recipe_id, plan_date, meal_type, title, memo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            userId, 
            targetGroupId, 
            recipe_id || null, // 레시피 없이 텍스트만 있는 식단일 수도 있으므로
            schedule_date, 
            meal_type, 
            title || null, 
            memo || null
        ]);

        // 프론트 응답용 데이터 구성
        const newSchedule = {
            schedule_id: result.insertId.toString(), // BIGINT는 JS에서 숫자로 정확치 않을 수 있어 문자열 변환 추천
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
        console.error("❌ 식단 추가 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생: " + error.message });
    }
};

// 3. 식단 삭제 (DELETE /schedule/:scheduleId)
export const deleteSchedule = async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const { scheduleId } = req.params;

    try {
        // 본인이 작성한 식단만 삭제 가능하도록 조건 추가 (user_id = ?)
        // 혹은 그룹 관리자라면 삭제 가능하게 로직 확장이 필요할 수 있음
        const deleteQuery = `
            DELETE FROM meal_plan 
            WHERE meal_plan_id = ? AND user_id = ?
        `;

        const [result] = await db.query(deleteQuery, [scheduleId, userId]);

        if (result.affectedRows === 0) {
            // 삭제된 행이 없으면: ID가 없거나, 내 글이 아님
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
        console.error("❌ 식단 삭제 에러:", error);
        res.status(500).json({ success: false, message: "서버 에러 발생" });
    }
};