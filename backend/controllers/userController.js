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
        // 계정 상태를 'DELETED'로 변경 (실제 데이터 삭제 X)
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

// 프로필 및 상세 정보 수정
export const updateProfile = async (req, res) => {
    const userId = req.user.user_id; 
    
    const { 
        // [1] 기본 정보
        nickname, email, phone_number, birthdate, age, gender, 
        
        // [2] 맵핑 정보 (ID 숫자가 담긴 배열. 예: [1, 3, 5])
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

        // (2) [알레르기 맵핑] (user_allergy 테이블)
        if (allergies !== undefined) {
            // 기존 데이터 삭제
            await connection.query('DELETE FROM user_allergy WHERE user_id = ?', [userId]);

            // 새 데이터 저장 (ID 배열이 있을 경우)
            if (Array.isArray(allergies) && allergies.length > 0) {
                const values = allergies.map(allergyId => [userId, allergyId]);
                await connection.query(
                    'INSERT INTO user_allergy (user_id, allergy_id) VALUES ?',
                    [values] 
                );
            }
        }

        // (3) [건강 상태 맵핑] (user_health_condition 테이블)
        if (health_conditions !== undefined) {
            // 기존 데이터 삭제
            await connection.query('DELETE FROM user_health_condition WHERE user_id = ?', [userId]);

            // 새 데이터 저장
            if (Array.isArray(health_conditions) && health_conditions.length > 0) {
                const values = health_conditions.map(conditionId => [userId, conditionId]);
                await connection.query(
                    'INSERT INTO user_health_condition (user_id, health_condition_id) VALUES ?',
                    [values] 
                );
            }
        }

        await connection.commit(); 
        console.log("[DEBUG] 프로필 및 ID 맵핑 업데이트 완료");
        res.status(200).json({ success: true, message: '저장되었습니다.' });

    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error("❌ 업데이트 실패:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
};