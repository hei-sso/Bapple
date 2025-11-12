import express from "express";
import {  kakaoTokenExchange, sendVerificationEmail, verifyEmailCode} from "../controllers/authController.js";
// import nodemailer from 'nodemailer';
// import crypto from 'crypto';
// import db from './db.js';
// import sgTransport from 'nodemailer-sendgrid-transport';


const router = express.Router();

// router.post("/api/auth/kakao/callback", kakaoCallback);
router.post('/kakao/token_exchange', kakaoTokenExchange);
router.post("/send_email", sendVerificationEmail);
router.post("/verify_email", verifyEmailCode);


export default router;
