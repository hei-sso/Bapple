import db from '../db.js';

// 1. 로그아웃
export const logout = (req, res) => {
    console.log(`[LOGOUT] 사용자 (ID: ${req.user.user_id}) 로그아웃 요청`);
    res.json({ success: true, message: '로그아웃 성공' });
};

// 2. 회원 탈퇴
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
            return res.status(404).json({ success: false, message: '이미 탈퇴한 계정입니다.' });
        }
        res.json({ success: true, message: '탈퇴 처리되었습니다.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};

// 3. 내 프로필 + 선택한 건강 정보 조회 (GET /api/user/profile)
export const getUserProfile = async (req, res) => {
    const userId = req.user.user_id;

    try {
        // (1) 유저 기본 정보
        const [userRows] = await db.query(
            `SELECT email, nickname, phone_number, birthday, gender, profile_image_url 
             FROM user WHERE user_id = ?`, 
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
        }

        // (2) 선택한 알레르기 ID 목록 (문자열 ID)
        const [allergyRows] = await db.query(
            `SELECT allergy_id FROM user_allergy WHERE user_id = ?`,
            [userId]
        );
        const allergyIds = allergyRows.map(row => row.allergy_id); 

        // (3) 선택한 건강 상태 ID 목록 (문자열 ID)
        const [healthRows] = await db.query(
            `SELECT health_condition_id FROM user_health_condition WHERE user_id = ?`,
            [userId]
        );
        const healthIds = healthRows.map(row => row.health_condition_id); 

        // (4) 응답
        res.json({ 
            success: true, 
            data: {
                ...userRows[0],
                allergies: allergyIds,          // ["A009", "A012"]
                health_conditions: healthIds    // ["HC001", "HC002"]
            } 
        });

    } catch (error) {
        console.error("❌ 프로필 조회 실패:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 4. 내 프로필 + 선택한 건강 정보 수정 (PUT /api/user/profile)
export const updateProfile = async (req, res) => {
    const userId = req.user.user_id; 
    
    const { 
        nickname, email, phone_number, birthday, gender, 
        allergies,          
        health_conditions   
    } = req.body;

    console.log(`[DEBUG] 프로필 업데이트 요청: UserID ${userId}`, req.body);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // (1) 유저 기본 정보 업데이트
        const userUpdates = [];
        const userValues = [];

        if (nickname !== undefined) { userUpdates.push('nickname = ?'); userValues.push(nickname); }
        if (email !== undefined) { userUpdates.push('email = ?'); userValues.push(email); }
        if (phone_number !== undefined) { userUpdates.push('phone_number = ?'); userValues.push(phone_number); }
        if (birthdate !== undefined) { userUpdates.push('birthday = ?'); userValues.push(birthdate); }
        if (gender !== undefined) { userUpdates.push('gender = ?'); userValues.push(gender); }

        if (userUpdates.length > 0) {
            const sql = `UPDATE user SET ${userUpdates.join(', ')} WHERE user_id = ?`;
            userValues.push(userId);
            await connection.query(sql, userValues);
        }

        // (2) 알레르기 정보 업데이트
        if (allergies !== undefined) {
            await connection.query('DELETE FROM user_allergy WHERE user_id = ?', [userId]);

            if (Array.isArray(allergies) && allergies.length > 0) {
                const values = allergies.map(id => [userId, id]);
                await connection.query(
                    'INSERT INTO user_allergy (user_id, allergy_id) VALUES ?',
                    [values] 
                );
            }
        }

        // (3) 건강 상태 정보 업데이트
        if (health_conditions !== undefined) {
            await connection.query('DELETE FROM user_health_condition WHERE user_id = ?', [userId]);

            if (Array.isArray(health_conditions) && health_conditions.length > 0) {
                const values = health_conditions.map(id => [userId, id]);
                await connection.query(
                    'INSERT INTO user_health_condition (user_id, health_condition_id) VALUES ?',
                    [values] 
                );
            }
        }

        await connection.commit();
        res.status(200).json({ success: true, message: '저장되었습니다.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ 업데이트 실패:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
};

// 5. [추가됨] 전체 건강 옵션 목록 조회 (GET /api/health/options)
// 이 함수도 이제 userController 안에 있습니다.
export const getHealthOptions = async (req, res) => {
  try {
    // 알레르기 목록 (DB 컬럼명 -> Front id, name)
    const [allergies] = await db.query(`
      SELECT allergy_id AS id, allergy_name AS name 
      FROM allergy
    `);
    
    // 건강 상태 목록 (DB 컬럼명 -> Front id, name)
    const [healthConditions] = await db.query(`
      SELECT health_condition_id AS id, health_condition_name AS name 
      FROM health_condition
    `);

    res.status(200).json({
      success: true,
      data: {
        allergy: allergies,           // [{id: "A009", name: "게"}, ...]
        health_condition: healthConditions // [{id: "HC001", name: "당뇨"}, ...]
      }
    });
  } catch (error) {
    console.error('건강 옵션 조회 실패:', error);
    res.status(500).json({ message: '서버 오류 발생' });
  }
};
