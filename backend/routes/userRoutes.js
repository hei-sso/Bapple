import express from "express";
import { logout, deleteAccount, updateProfile, getUserProfile } from "../controllers/userController.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// POST /api/user/logout
router.post('/logout', authenticateToken, logout);

// DELETE /api/user/delete_account
router.delete('/delete_account', authenticateToken, deleteAccount);

// PUT /api/user/profile
router.put('/profile', authenticateToken, updateProfile);

// GET /api/user/profile
router.get('/profile', authenticateToken, getUserProfile);

export default router;

