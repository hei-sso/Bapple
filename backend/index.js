import express from 'express';
import cors from 'cors';
// import bodyParser from 'body-parser';
import dotenv from 'dotenv';
// import session from 'express-session';
// import cookieParser from 'cookie-parser';
// import csurf from 'csurf';
import dbPool from './db.js';
import authRoutes from './routes/authRoutes.js';


//환경 변수 dotenv를 통해 관리 및 로드
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//미들 웨어 설정
// app.use(cors({
//   origin: 'http://localhost:8081',
//   credentials: true
// })); // 모든 접근 허용
// app.use(bodyParser.json()); // 요청 본문 파싱
// app.use(cookieParser());
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 1000 * 60 * 60
//   }
// }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// const csrfProtection = csurf({ cookie: true });
// app.use(csrfProtection);

// 루트 경로 설정(서버상태 확인)
app.get('/', (req, res) => {
    res.json({message: 'backend API 작동', status : '준비 완료'});
})

// app.get('/api/csrf-token', (req, res) => {
//   res.json({ csrfToken: req.csrfToken()});
// });

//인증 라우트 연결
app.use("/api/auth", authRoutes);

// app.use((err, req, res, next) => {
//   if (err.code === "EBADCSRFTOKEN") {
//     console.warn('CSRF 토큰이 유효하지 않습니다.', req.path);
//     res.status(403).json({ success: false, message: 'CSRF 토큰이 유효하지 않음'});
//   } else {
//     next(err);
//   }
// });

app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중`);
});