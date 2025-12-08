import express from "express";
import * as recommendController from "../controllers/recommendController.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// 1) 단일 추천 리스트
router.post("/", authenticateToken, recommendController.getSingleRecommendation);

// 2) 주간 식단 추천
router.post("/week", authenticateToken, recommendController.getWeeklyRecommendation);

// 3) 주간 추천 시작 (배치 생성 + AI 호출 + 저장)
router.post("/week/start", authenticateToken, recommendController.startWeeklyRecommendation);

// 4) 다음 추천 불러오기 (리필)
router.post("/week/next", authenticateToken, recommendController.getNextWeeklyRecommendation);

export default router;