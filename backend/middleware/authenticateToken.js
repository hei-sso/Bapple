import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
    // [DEBUG] 1. 헤더 도착 확인
    const authHeader = req.headers['authorization'];
    console.log(`[AUTH] 1. 헤더 수신: ${authHeader ? 'O (존재함)' : 'X (NULL)'}`);
    if (authHeader) console.log(`[AUTH]    헤더 값: ${authHeader}`);

    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log("[AUTH] 🚨 토큰 추출 실패 (Bearer 형식이 아니거나 없음)");
        return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    try {
        // [DEBUG] 2. 토큰 검증 시도
        // console.log(`[AUTH] 2. 토큰 검증 시도: ${token.substring(0, 15)}...`); 
        
        const payload = jwt.verify(token, JWT_SECRET);
        console.log(`[AUTH] ✅ 토큰 검증 성공! UserID: ${payload.userId}`);

        // [DEBUG] 3. DB 조회
        const [rows] = await db.query(
            'SELECT user_id, email, nickname, status FROM user WHERE user_id = ?',
            [payload.userId]
        );

        const user = rows[0];

        if (!user) {
            console.log(`[AUTH] 🚨 DB 조회 실패: UserID ${payload.userId} 가 없습니다.`);
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        if (user.status !== 'ACTIVE') {
            console.log(`[AUTH] 🚨 비활성 유저: ${user.status}`);
            return res.status(403).json({ 
                message: '비활성화되거나 탈퇴한 계정입니다.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        req.user = user; 
        next(); 

    } catch (err) {
        // [DEBUG] 4. 에러 발생 원인 출력 (여기가 제일 중요합니다!)
        console.error(`[AUTH] ❌ 검증 에러 발생: ${err.name}`);
        console.error(`[AUTH]    에러 메시지: ${err.message}`);

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