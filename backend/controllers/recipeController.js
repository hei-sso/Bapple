// controllers/recipeController.js
import db from '../db.js';
import { syncUserToBatch } from '../services/recommendationService.js';

// 1. 전체 레시피 조회 (GET /recipe/all)
// [수정] cuisine_type을 기준으로 카테고리를 생성하여 반환합니다.
export const getAllRecipes = async (req, res) => {
  console.log('[DEBUG] [GET] 전체 레시피 조회 요청');
  try {
    // 1. DB에서 전체 레시피 가져오기
    // (cuisine_type 컬럼이 있다고 가정하고 SELECT * 로 다 가져옵니다)
    const query = `SELECT * FROM recipe`;
    const [recipes] = await db.query(query);
    console.log(`[DEBUG] 레시피 ${recipes.length}개 로드 성공`);

    // 2. 데이터 가공 시작
    // (1) '전체' 카테고리 생성 (모든 레시피 포함)
    const result = [{
      id: 'all',
      name: '전체',
      recipes: recipes
    }];

    // (2) cuisine_type(요리 종류)별로 레시피 분류
    const categoryMap = {};

    recipes.forEach(recipe => {
      // DB 컬럼명이 cuisine_type 이라고 하셨으므로 해당 필드 사용
      const type = recipe.cuisine_type; 
      
      if (type) {
        // 혹시 데이터에 공백이 있을 수 있으니 trim() 처리
        const cleanType = type.trim();

        if (!categoryMap[cleanType]) {
          categoryMap[cleanType] = [];
        }
        categoryMap[cleanType].push(recipe);
      }
    });

    // (3) 분류된 그룹을 result 배열에 추가
    Object.keys(categoryMap).forEach(typeName => {
      result.push({
        id: typeName,   // 카테고리 ID (예: '한식')
        name: typeName, // 화면에 보여줄 이름 (예: '한식')
        recipes: categoryMap[typeName]
      });
    });

    // 3. 최종 응답
    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('[ERROR] 전체 레시피 조회 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};

// 2. 찜 목록 조회 (GET /recipe/favorite)
// (여기는 수정할 필요 없이 그대로 둡니다)
export const getMyFavorites = async (req, res) => {
  const userId = req.user.user_id;
  console.log(`[DEBUG] [GET] 찜 목록 조회 요청 (User: ${userId})`);

  try {
    const query = `
      SELECT 
        r.*, 
        rf.created_at as liked_at
      FROM recipe_favorite rf
      JOIN recipe r ON rf.recipe_id = r.recipe_id 
      WHERE rf.user_id = ?
      ORDER BY rf.created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[ERROR] 찜 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};

// 3. 찜 추가 (POST /recipe/favorite)
export const addRecipeToFavorite = async (req, res) => {
  const userId = req.user.user_id;
  const { recipe_id } = req.body; 

  try {
    const [exists] = await db.query(
      'SELECT 1 FROM recipe_favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipe_id]
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: '이미 찜한 레시피입니다.' });
    }

    await db.query(
      'INSERT INTO recipe_favorite (user_id, recipe_id, created_at) VALUES (?, ?, NOW())',
      [userId, recipe_id]
    );

    try { syncUserToBatch(userId); } catch (e) { console.warn('추천 동기화 실패:', e.message); }

    res.status(201).json({ success: true, message: '찜 추가됨' });
  } catch (error) {
    console.error('[ERROR] 찜 추가 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};

// 4. 찜 삭제 (DELETE /recipe/favorite/:recipeId)
export const removeRecipeFromFavorite = async (req, res) => {
  const userId = req.user.user_id;
  const { recipeId } = req.params; 

  try {
    const [result] = await db.query(
      'DELETE FROM recipe_favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '찜 목록에 없습니다.' });
    }

    try { syncUserToBatch(userId); } catch (e) { console.warn('추천 동기화 실패:', e.message); }

    res.status(200).json({ success: true, message: '삭제 완료' });
  } catch (error) {
    console.error('[ERROR] 찜 삭제 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};