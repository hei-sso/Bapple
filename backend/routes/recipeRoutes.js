// routes/recipeRoutes.js
import express from 'express';
import { 
  getAllRecipes, 
  getMyFavorites, 
  addRecipeToFavorite, 
  removeRecipeFromFavorite 
} from '../controllers/recipeController.js'; // 컨트롤러 경로는 실제 위치에 맞게 수정
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// 1. 전체 레시피 조회 (GET /recipe/all)
router.get('/all', getAllRecipes);

// 2. 찜 목록 조회 (GET /recipe/favorite) - 로그인 필요
router.get('/favorite', authenticateToken, getMyFavorites);

// 3. 찜 추가 (POST /recipe/favorite) - 로그인 필요
router.post('/favorite', authenticateToken, addRecipeToFavorite);

// 4. 찜 삭제 (DELETE /recipe/favorite/:recipeId) - 로그인 필요
router.delete('/favorite/:recipeId', authenticateToken, removeRecipeFromFavorite);

export default router;