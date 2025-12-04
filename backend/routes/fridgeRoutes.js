import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js'; 

import { 
  getMyIngredients, 
  addIngredientToMyFridge, 
  removeIngredientFromMyFridge 
} from '../controllers/fridgeController.js';

const router = express.Router();

// [수정] 변수명도 authenticateToken으로 변경
router.get('/my', authenticateToken, getMyIngredients);
router.post('/my', authenticateToken, addIngredientToMyFridge);
router.delete('/my/:ingredientId', authenticateToken, removeIngredientFromMyFridge);

export default router;