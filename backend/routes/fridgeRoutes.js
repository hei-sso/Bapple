import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { 
  getMyIngredients, 
  addIngredientToMyFridge, 
  removeIngredientFromMyFridge 
} from '../controllers/fridgeController.js';

const router = express.Router();

// URL이 프론트엔드 API 요청(/fridge/my)과 정확히 일치해야 합니다.
router.get('/my', verifyToken, getMyIngredients);
router.post('/my', verifyToken, addIngredientToMyFridge);
router.delete('/my/:ingredientId', verifyToken, removeIngredientFromMyFridge);

export default router;