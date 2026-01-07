import express from "express";
import * as scheduleController from "../controllers/scheduleController.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// 1) 내 식단 스케줄 조회 (GET /schedule/my)
router.get("/my", authenticateToken, scheduleController.getMySchedules);

// 2) 식단 메뉴 추가 (POST /schedule)
router.post("/", authenticateToken, scheduleController.addSchedule);

// 3) 식단 메뉴 삭제 (DELETE /schedule/:scheduleId)
router.delete("/:scheduleId", authenticateToken, scheduleController.deleteSchedule);

export default router;