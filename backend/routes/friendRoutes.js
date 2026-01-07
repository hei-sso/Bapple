import express from 'express';
import { updateFollowStatus, getFriendsList } from '../controllers/friendController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// 모든 친구 관련 API는 로그인이 필요하므로 미들웨어 적용
router.use(authenticateToken);

// 1. 친구 목록 및 내 코드 조회
router.get('/list', getFriendsList);

// 2. 친구 팔로우 / 언팔로우 (친구 코드로 추가)
router.post('/follow', updateFollowStatus);

export default router;