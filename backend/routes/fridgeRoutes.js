import express from 'express';
import { addIngredient, deleteIngredient, getIngredients } from '../controllers/fridgeController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/ingredient', authenticateToken, addIngredient);
router.delete('/ingredient/:ingredientId', authenticateToken, deleteIngredient);
router.get('/:fridgeId/ingredients', authenticateToken, getIngredients);

export default router;