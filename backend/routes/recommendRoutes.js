import express from "express";
import axios from "axios";

const router = express.Router();

const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL; 

// 1) 단일 추천 리스트 (오늘 먹을 레시피 추천)
// POST /api/recommend
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // FastAPI로 그대로 전달
    const response = await axios.post(`${AI_BASE_URL}/recommend`, body, {
      headers: { "Content-Type": "application/json" }
    });

    return res.json({
      success: true,
      data: response.data,
    });

    } catch (err) {
    console.error("FastAPI /recommend 호출 실패:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "AI 추천 서버 호출 실패",
      error: err.response?.data || err.message,
    });
  }
});

// 2) 주간 식단 추천 (7일 × N끼니)
// POST /api/recommend/week
router.post("/week", async (req, res) => {
  try {
    const body = req.body;

    // FastAPI로 전달
    const response = await axios.post(`${AI_BASE_URL}/recommend/week`, body, {
      headers: { "Content-Type": "application/json" }
    });

    return res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("FastAPI /recommend/week 호출 실패:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "AI 주간추천 서버 호출 실패",
      error: err.response?.data || err.message,
    });
  }
});

export default router;