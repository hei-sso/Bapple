// controllers/recipeController.js
import db from '../db.js';
// ✅ 추천 시스템 동기화 (사용자가 찜을 하면 취향이 바뀌므로 AI에게 알려줌)
import { syncUserToBatch } from '../services/recommendationService.js';

// 1. 전체 레시피 조회 (GET /recipe/all)
export const getAllRecipes = async (req, res) => {
  console.log('[DEBUG] [GET] 전체 레시피 조회 요청');
  try {
    // 카테고리 정보까지 포함해서 조회
    const query = `
      SELECT 
        r.id, 
        r.name, 
        r.image_url, 
        r.time, 
        r.difficulty, 
        c.category_name 
      FROM recipe r
      LEFT JOIN recipe_category c ON r.category_id = c.id
      ORDER BY r.id ASC
    `;
    
    const [rows] = await db.query(query);
    
    // 프론트엔드가 카테고리별 그룹화를 원한다면 아래처럼 가공 (선택사항)
    // 현재 프론트엔드 로직(recipeAPI.ts)을 보니 단순히 리스트를 받아서 처리하는 것으로 보입니다.
    // 전체 리스트를 반환합니다.
    
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[ERROR] 전체 레시피 조회 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 2. 찜 목록 조회 (GET /recipe/favorite)
export const getMyFavorites = async (req, res) => {
  const userId = req.user.user_id;
  console.log(`[DEBUG] [GET] 찜 목록 조회 요청 (User: ${userId})`);

  try {
    // recipe_favorite 테이블과 recipe 테이블을 JOIN 하여 실제 정보를 가져옴
    const query = `
      SELECT 
        r.id, 
        r.name, 
        r.image_url, 
        r.time, 
        r.difficulty, 
        rf.created_at as liked_at
      FROM recipe_favorite rf
      JOIN recipe r ON rf.recipe_id = r.id
      WHERE rf.user_id = ?
      ORDER BY rf.created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);
    console.log(`[DEBUG] 찜한 레시피 ${rows.length}개 로드 완료`);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[ERROR] 찜 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 3. 찜 추가 (POST /recipe/favorite)
export const addRecipeToFavorite = async (req, res) => {
  const userId = req.user.user_id;
  const { recipe_id } = req.body;

  console.log(`[DEBUG] [POST] 찜 추가 요청 (User: ${userId}, Recipe: ${recipe_id})`);

  try {
    // 1. 이미 찜했는지 확인 (중복 방지)
    const [exists] = await db.query(
      'SELECT 1 FROM recipe_favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipe_id]
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: '이미 찜한 레시피입니다.' });
    }

    // 2. 찜 저장
    await db.query(
      'INSERT INTO recipe_favorite (user_id, recipe_id, created_at) VALUES (?, ?, NOW())',
      [userId, recipe_id]
    );

    // ✅ 3. 추천 데이터 동기화 (취향이 변했으므로 업데이트)
    console.log(`[DEBUG] 찜 추가 -> 추천 시스템 데이터 동기화 요청...`);
    syncUserToBatch(userId);

    res.status(201).json({ success: true, message: '찜 목록에 추가되었습니다.' });
  } catch (error) {
    console.error('[ERROR] 찜 추가 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 4. 찜 삭제 (DELETE /recipe/favorite/:recipeId)
export const removeRecipeFromFavorite = async (req, res) => {
  const userId = req.user.user_id;
  const { recipeId } = req.params;

  console.log(`[DEBUG] [DELETE] 찜 삭제 요청 (User: ${userId}, Recipe: ${recipeId})`);

  try {
    const [result] = await db.query(
      'DELETE FROM recipe_favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '찜 목록에 없는 레시피입니다.' });
    }

    // ✅ 3. 추천 데이터 동기화 (취향이 변했으므로 업데이트)
    console.log(`[DEBUG] 찜 삭제 -> 추천 시스템 데이터 동기화 요청...`);
    syncUserToBatch(userId);

    res.status(200).json({ success: true, message: '찜 목록에서 삭제되었습니다.' });
  } catch (error) {
    console.error('[ERROR] 찜 삭제 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};