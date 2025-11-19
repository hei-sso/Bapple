import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import db from './db.js'; 
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

// 환경 변수 로드
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//  허용할 도메인 목록 (Whitelist)
const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:8080',
  'http://localhost:3000',
  'https://bapple-production.up.railway.app' // 배포된 백엔드 주소
];

app.use(cors({
    origin: function (origin, callback) {
        // 1. !origin: 앱, Postman 등 Origin 헤더가 없는 요청 허용
        // 2. allowedOrigins: 화이트리스트 도메인 허용
        // 3. startsWith: 내부 IP 등 허용
        if (!origin || allowedOrigins.includes(origin) || 
            allowedOrigins.some(o => origin.startsWith(o)) || 
            origin.includes('192.168.') || origin.includes('10.')) {
            
            callback(null, true); // ✅ 통과
        } else {
            // [수정] 에러를 던지지 않고 false를 반환하여 서버가 죽는 것을 방지함
            console.log("CORS Blocked (Safe Reject):", origin); 
            callback(null, false); //  거절 (서버는 죽지 않음)
        }
    },
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 루트 경로 설정
app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

// 인증 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});
