import db from '../db.js';

export const logout = (req, res) => {
    console.log(`[LOGOUT] 사용자 (ID: ${req.user.user_id}) 로그아웃 요청`);

    // TODO : FCM 토큰 등을 DB에서 삭제하는 로직 추가
    res.json({ success: true, message: '로그아웃 성공' });
};

export const deleteAccount = async (req, res) => {
    const userId = req.user.user_id;
    console.log(`[DELETE ACCOUNT] 사용자 (ID: ${userId}) 탈퇴 요청`);
    try {
        const query = 
        `UPDATE user SET
            status = 'DELETED',
            deleted_at = NOW()
            WHERE user_id = ? AND status = 'ACTIVE'`;

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
