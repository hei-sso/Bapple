import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

//환경 변수 dotenv를 통해 관리 및 로드
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

//미들 웨어 설정
app.use(cors()); // 모든 접근 허용
app.use(bodyParser.json()); // 요청 본문 파싱

// 루트 경로 설정(서버상태 확인)
app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

//인증 라우트 연결
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});