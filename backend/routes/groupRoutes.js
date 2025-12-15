// backend/routes/groupRoutes.js

import express from 'express';
import groupController from '../controllers/groupController.js'; 
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// 1. 내 그룹 목록 조회
router.get('/groups/my', authenticateToken, groupController.getMyGroups);

// 2. 그룹 생성 (GroupCreationModal에서 호출)
router.post('/groups', authenticateToken, groupController.createGroup);

// 3. 그룹 가입 (초대 코드 입력)
router.post('/groups/join', authenticateToken, groupController.joinGroup);

// 4. 그룹 핀 고정 토글
router.patch('/groups/:groupId/pin', authenticateToken, groupController.togglePin);

// 5. 식단(스케줄) 관련 (meal_plan 테이블 사용)
router.get('/schedule/my', authenticateToken, groupController.getMySchedules);
router.post('/schedule', authenticateToken, groupController.addSchedule);
router.delete('/schedule/:scheduleId', authenticateToken, groupController.deleteSchedule);

// [추가됨] 초대 코드 조회 API
// 프론트엔드 호출: axios.get(`${RAILWAY_BASE_URL}/groups/${groupId}/invite-code`)
router.get('/:groupId/invite-code', authenticateToken, groupController.getInviteCode);

export default router;