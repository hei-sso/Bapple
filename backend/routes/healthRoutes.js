import express from 'express';
import { getHealthOptions } from '../controllers/userController.js'; 
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// GET /api/health/options
router.get('/options', authenticateToken, getHealthOptions);

export default router;