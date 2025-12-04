import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js'; 
import { 
  getMyIngredients, 
  addIngredientToMyFridge, 
  removeIngredientFromMyFridge,
  // [주의] 아래 컨트롤러 함수가 fridgeController에 있는지 꼭 확인하세요!
  // 없다면 만들어야 합니다. (전체 재료 목록 반환용)
  getAllIngredients 
} from '../controllers/fridgeController.js';

const router = express.Router();

// 1. [Public] 전체 재료/카테고리 목록 조회
router.get('/ingredients', getAllIngredients);

// 2. [Private] 내 냉장고 재료 조회/추가/삭제
router.get('/my', authenticateToken, getMyIngredients);
router.post('/my', authenticateToken, addIngredientToMyFridge);
router.delete('/my/:ingredientId', authenticateToken, removeIngredientFromMyFridge);

export default router;