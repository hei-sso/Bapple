import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import db from './db.js'; 
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import fridgeRoutes from './routes/fridgeRoutes.js';
import recommendRoutes from "./routes/recommendRoutes.js";
import healthRoutes from './routes/healthRoutes.js'; 
import recipeRoutes from './routes/recipeRoutes.js';

// 환경 변수 로드
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//  허용할 도메인 목록 (Whitelist)
const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:8080',
  'http://localhost:3000',
  'https://bapple-production.up.railway.app' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || 
            allowedOrigins.some(o => origin.startsWith(o)) || 
            origin.includes('192.168.') || origin.includes('10.')) {
            
            callback(null, true); 
        } else {
            console.log("CORS Blocked (Safe Reject):", origin); 
            callback(null, false); 
        }
    },
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 

// 루트 경로 설정
app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

// 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/user", userRoutes);
app.use('/', groupRoutes);
app.use('/fridge', fridgeRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/health", healthRoutes);
app.use('/recipe', recipeRoutes);

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 ${PORT}번 포트에서 0.0.0.0으로 실행 중`);
});