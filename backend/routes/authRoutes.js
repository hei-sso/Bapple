import express from "express";
import { kakaoCallback } from "../controllers/authController.js";

const router = express.Router();

// Redirect URI (카카오 인증 후 돌아오는 곳)
router.get("/kakao/callback", kakaoCallback);

export default router;
