import express from 'express';
import { createGroup, joinGroup, getMembers } from '../controllers/groupController.js';
import authenticateToken from '../middleware/authenticateToken.js'; // 확장자 주의

const router = express.Router();

router.post('/create', authenticateToken, createGroup);
router.post('/join', authenticateToken, joinGroup);
router.get('/:groupId/members', authenticateToken, getMembers);

export default router;