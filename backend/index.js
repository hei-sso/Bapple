import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import db from './db.js'; 
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

//환경 변수 dotenv를 통해 관리 및 로드
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//미들 웨어 설정a
const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:8080',
  ];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || 
        origin.includes('192.168.') || origin.includes('10.')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Expo에서 헤더를 주고받으려면 필요할 수 있음
}));
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 루트 경로 설정(서버상태 확인)
app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

//인증 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

//서버 시작
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});