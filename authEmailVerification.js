const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const csrfProtection = require('csurf')();

//이메일 인증 코드 발송 라우트
router.post('/send_verification_code', csrfProtection, async (req, res) => {
    const { email } = req.body; //요청 본문에서 이메일을 가져옴
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase(); //인증코드 생성
    const expirationTime = Date.now() + 300000; // 5분 만료시간 설정
    try{
        //이메일 전송을 위한 nodemailer 설정
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, //환경변수에서 이메일 사용자 이름 가져오기
                pass: process.env.EMAIL_PASS, //환경변수에서 이메일 비밀번호 가져오기
            },
        });
        //이메일 전송
        await transporter.sendMail(mailOption);
        //세션에 인증 코드가 만료 시간 저장
        req.session.verificationCode = {
            code: verificationCode,
            expires: expirationTime,
        };
        res.json({ success: true });
    } catch (err) {
        console.error('인증 코드가 발송 중 오류 발생: ', err);
        //오류 로그 출력
        res.json({ success: false });
    }
});
module.exports = router;