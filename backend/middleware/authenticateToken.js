import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT 토큰을 검증하는 미들웨어 (경비원)
 * 1. 헤더에서 'Authorization' 토큰을 가져옵니다.
 * 2. 토큰을 검증(verify)합니다.
 * 3. 검증 성공 시, 토큰의 payload(userId)를 `req.user` 객체에 저장합니다.
 * 4. DB를 조회하여 `status`가 'ACTIVE'인지 확인합니다.
 * 5. 다음 미들웨어(컨트롤러)로 전달합니다.
 */
const authenticateToken = async (req, res, next) => {
    // 1. 헤더에서 토큰 가져오기
    const authHeader = req.headers['authorization'];
    // 헤더 형식: "Bearer TOKEN_VALUE"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 토큰이 아예 없는 경우
        return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    try {
        // 2. 토큰 검증
        const payload = jwt.verify(token, JWT_SECRET);
        
        // 3. (★중요★) DB에서 실제 사용자 상태(status) 확인
        const [rows] = await db.query(
            'SELECT user_id, email, nickname, status FROM user WHERE user_id = ?',
            [payload.userId]
        );

        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 4. 탈퇴(DELETED) 또는 비활성(INACTIVE) 사용자인지 확인
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: '비활성화되거나 탈퇴한 계정입니다.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // 5. 검증 성공! req 객체에 사용자 정보 저장
        // (이제 이 요청을 받는 컨트롤러는 req.user.userId 등으로 사용자 ID에 접근 가능)
        req.user = user; 
        
        next(); // 다음 미들웨어(컨트롤러)로 진행

    } catch (err) {
        // 4. 토큰 검증 실패 (만료(expired) 또는 서명 불일치)
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: '토큰이 만료되었습니다.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({ 
            message: '유효하지 않은 토큰입니다.',
            code: 'TOKEN_INVALID'
        });
    }
};

export default authenticateToken;