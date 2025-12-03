import express from "express";
import {  kakaoTokenExchange, refreshAccessToken, sendVerificationEmail, verifyEmailCode} from "../controllers/authController.js";

const router = express.Router();

router.get('/kakao/callback', (req, res) => {
  res.redirect(`bapple://kakao?code=${req.query.code}`); 
});
router.post('/refresh-token', refreshAccessToken);
// router.post("/api/auth/kakao/callback", kakaoCallback);
router.post('/kakao/token_exchange', kakaoTokenExchange);
router.post("/send_email", sendVerificationEmail);
router.post("/verify_email", verifyEmailCode);


export default router;
