import db from '../db.js';

// 로그아웃
export const logout = (req, res) => {
    console.log(`[LOGOUT] 사용자 (ID: ${req.user.user_id}) 로그아웃 요청`);
    // 추후 Redis나 DB에서 리프레시 토큰 삭제 로직 등 추가 가능
    res.json({ success: true, message: '로그아웃 성공' });
};

// 회원 탈퇴 (Soft Delete)
export const deleteAccount = async (req, res) => {
    const userId = req.user.user_id;
    console.log(`[DELETE ACCOUNT] 사용자 (ID: ${userId}) 탈퇴 요청`);
    
    try {
        const query = `
            UPDATE user SET
            status = 'DELETED',
            deleted_at = NOW()
            WHERE user_id = ? AND status = 'ACTIVE'
        `;

        const [result] = await db.query(query, [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없거나 이미 탈퇴한 계정입니다.' });
        }

        res.json({ success: true, message: '계정이 성공적으로 탈퇴 처리되었습니다.' });

    } catch (err) {
        console.error('계정 탈퇴 중 오류 발생 : ', err);
        res.status(500).json({ success: false, message: '서버 오류 발생' });
    }
};

// 내 프로필 정보 조회 (GET)
export const getUserProfile = async (req, res) => {
    const userId = req.user.user_id;
    console.log(`[GET PROFILE] 사용자 (ID: ${userId}) 정보 조회 요청`);

    try {
        // (1) 기본 정보 조회
        const [userRows] = await db.query(
            `SELECT email, nickname, phone_number, birthdate, age, gender, profile_image_url 
             FROM user WHERE user_id = ?`, 
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
        }
        const userInfo = userRows[0];

        // (2) 알레르기 정보 조회 (ID 목록 반환)
        const [allergyRows] = await db.query(
            `SELECT allergy_id FROM user_allergy WHERE user_id = ?`,
            [userId]
        );
        const allergyIds = allergyRows.map(row => row.allergy_id);

        // (3) 건강 상태 정보 조회 (ID 목록 반환)
        const [healthRows] = await db.query(
            `SELECT health_condition_id FROM user_health_condition WHERE user_id = ?`,
            [userId]
        );
        const healthIds = healthRows.map(row => row.health_condition_id);

        // (4) 응답 데이터 구성
        const responseData = {
            ...userInfo,
            allergies: allergyIds,          // 예: [1, 3]
            health_conditions: healthIds    // 예: [2, 5]
        };

        res.json({ success: true, data: responseData });

    } catch (error) {
        console.error("❌ 프로필 조회 실패:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 프로필 및 상세 정보 수정 (PUT)
export const updateProfile = async (req, res) => {
    const userId = req.user.user_id; 
    
    const { 
        // [1] 기본 정보
        nickname, email, phone_number, birthdate, age, gender, 
        
        // [2] 맵핑 정보 (ID 배열)
        allergies,          // allergy_id 리스트
        health_conditions   // health_condition_id 리스트
    } = req.body;

    console.log(`[DEBUG] 프로필 업데이트 요청: UserID ${userId}`, req.body);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // 트랜잭션 시작

        // (1) [USER 테이블] 기본 정보 업데이트
        const userUpdates = [];
        const userValues = [];

        if (nickname !== undefined) { userUpdates.push('nickname = ?'); userValues.push(nickname); }
        if (email !== undefined) { userUpdates.push('email = ?'); userValues.push(email); }
        if (phone_number !== undefined) { userUpdates.push('phone_number = ?'); userValues.push(phone_number); }
        if (birthdate !== undefined) { userUpdates.push('birthdate = ?'); userValues.push(birthdate); }
        if (age !== undefined) { userUpdates.push('age = ?'); userValues.push(age); }
        if (gender !== undefined) { userUpdates.push('gender = ?'); userValues.push(gender); }

        if (userUpdates.length > 0) {
            const sql = `UPDATE user SET ${userUpdates.join(', ')} WHERE user_id = ?`;
            userValues.push(userId);
            await connection.query(sql, userValues);
        }

        // (2) [USER_ALLERGY 테이블] 알레르기 맵핑
        if (allergies !== undefined) {
            await connection.query('DELETE FROM user_allergy WHERE user_id = ?', [userId]);

            if (Array.isArray(allergies) && allergies.length > 0) {
                const values = allergies.map(allergyId => [userId, allergyId]);
                await connection.query(
                    'INSERT INTO user_allergy (user_id, allergy_id) VALUES ?',
                    [values] 
                );
            }
        }

        // (3) [USER_HEALTH_CONDITION 테이블] 건강 상태 맵핑
        if (health_conditions !== undefined) {
            await connection.query('DELETE FROM user_health_condition WHERE user_id = ?', [userId]);

            if (Array.isArray(health_conditions) && health_conditions.length > 0) {
                const values = health_conditions.map(conditionId => [userId, conditionId]);
                await connection.query(
                    'INSERT INTO user_health_condition (user_id, health_condition_id) VALUES ?',
                    [values] 
                );
            }
        }

        await connection.commit(); 
        console.log("[DEBUG] 프로필 및 상세 정보(식재료 제외) 업데이트 완료");
        res.status(200).json({ success: true, message: '저장되었습니다.' });

    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error("❌ 업데이트 실패:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
};