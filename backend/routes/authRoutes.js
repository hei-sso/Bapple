import express from "express";
import { kakaoCallback, kakaoTokenExchage, sendVerificationEmail, verifyEmailCode} from "../controllers/authController.js";
// import nodemailer from 'nodemailer';
// import crypto from 'crypto';
// import db from './db.js';
// import sgTransport from 'nodemailer-sendgrid-transport';


const router = express.Router();

router.post("/kakao/login", kakaoCallback);
router.post("/api/auth/kakao/token_exchange", kakaoTokenExchange);
router.post("send_verification_code", sendVerificationEmail);
router.post("/verify_code", verifyEmailCode);

// 카카오 로그인 인증 라우터
// router.get("/kakao/callback", kakaoCallback);

// // --- SendGrid 설정 (실전용) ---
// const sendgridOptions = {
//     auth: {
//         api_key: process.env.SENDGRID_API_KEY
//     }
// };
// const transporter = nodemailer.createTransport(sgTransport(sendgridOptions));

// // --- 이메일 인증 (저장소 = 세션) ---

// // POST /api/auth/send_verification_code
// router.post('/send_verification_code', async (req, res) => {
//     const { email } = req.body; 
    
//     if (!email) {
//         return res.status(400).json({success:false, message: '이메일 주소를 입력해주세요.'});
//     }
    
//     //6자리 숫자를 만드는 코드
//     const verificationCode = crypto.randomInt(100000, 1000000).toString(); 
    
//     const expirationTime = Date.now() + 5 * 60 * 1000; // 5분 뒤

//     try {
//         const mailOption = {
//             from: process.env.SENDGRID_FROM_EMAIL,
//             to: email, 
//             subject: '회원가입 인증 코드',
//             html: `<h1>인증 코드: ${verificationCode}</h1><p>5분 내에 입력해주세요.</p>`,
//         };

//         // 세션에 저장
//         req.session.verificationCode = {
//             email: email,
//             code: verificationCode,
//             expires: expirationTime,
//         };

//         // 실제 SendGrid로 메일 발송
//         await transporter.sendMail(mailOption);
        
//         console.log(`[SendGrid] 실제 메일 발송 성공 : ${email}로 ${verificationCode} 전송`);
        
//         res.json({ 
//             success: true, 
//             message: '인증코드 성공적으로 발송됨 '
//         });

//     } catch (err) {
//         console.error('인증 코드 발송 중 오류 발생: ', err);
//         if (err.response && err.response.body && err.response.body.errors) {
//             console.error('SendGrid Error Details: ', err.response.body.errors);
//         }
//         res.status(500).json({ success: false, message: '인증코드 발송 실패'});
//     }
// });

// // POST /api/auth/verify_code
// router.post('/verify_code', (req, res) => { 
//     const { email, code } = req.body;
//     const verificationData = req.session.verificationCode;

//     try {
//         if (!verificationData) {
//             return res.status(400).json({
//                 success: false,
//                 message: '인증 코드를 요청한 기록이 없습니다.'
//             });
//         }

//         if (Date.now() > verificationData.expires) {
//             delete req.session.verificationCode;
//             return res.status(400).json({
//                 success: false,
//                 message: '인증 코드가 만료되었습니다.'
//             });
//         }

//         if (code !== verificationData.code || email !== verificationData.email) {
//             return res.status(400).json({
//                 success: false,
//                 message: '인증 코드가 일치하지 않습니다.'
//             });
//         }
    
//         delete req.session.verificationCode;
//         res.json({success:true, message: '이메일 인증 성공'});
//     } catch (err) {
//         console.error('인증코드 검증 중 오류 발생 : ', err);
//         res.status(500).json({ success:false, message: '서버 오류 발생'});
//     }
// });

export default router;