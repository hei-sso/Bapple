import db from '../db.js';
import { syncUserToBatch } from '../services/recommendationService.js';

// 1. 전체 레시피 조회 (GET /recipe/all)
export const getAllRecipes = async (req, res) => {
  console.log('[DEBUG] [GET] 전체 레시피 조회 요청');
  try {
    // [수정] DB 컬럼명(recipe_id, name, img_url)에 맞춰 조회
    const query = `
      SELECT recipe_id, name, img_url 
      FROM recipe 
    `;
    
    const [rows] = await db.query(query);
    console.log(`[DEBUG] 레시피 ${rows.length}개 로드 성공`);
    
    // 프론트엔드에서 'id'라는 이름을 기대할 수도 있으니 
    // 필요하다면 map으로 변환해줄 수도 있지만, 일단 그대로 보냅니다.
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[ERROR] 전체 레시피 조회 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};

// 2. 찜 목록 조회 (GET /recipe/favorite)
export const getMyFavorites = async (req, res) => {
  const userId = req.user.user_id;
  console.log(`[DEBUG] [GET] 찜 목록 조회 요청 (User: ${userId})`);

  try {
    // [수정] recipe_id(문자열)를 기준으로 JOIN
    const query = `
      SELECT 
        r.recipe_id, 
        r.name, 
        r.img_url, 
        rf.created_at as liked_at
      FROM recipe_favorite rf
      JOIN recipe r ON rf.recipe_id = r.recipe_id 
      WHERE rf.user_id = ?
      ORDER BY rf.created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);
    console.log(`[DEBUG] 찜한 레시피 ${rows.length}개 로드 완료`);
    
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

  console.log(`[DEBUG] 찜 추가 요청: User ${userId}, Recipe ${recipe_id}`);

  try {
    // [수정] recipe_id 기준 중복 체크
    const [exists] = await db.query(
      'SELECT 1 FROM recipe_favorite WHERE user_id = ? AND recipe_id = ?',
      [userId, recipe_id]
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: '이미 찜한 레시피입니다.' });
    }

    // [수정] recipe_id 저장
    await db.query(
      'INSERT INTO recipe_favorite (user_id, recipe_id, created_at) VALUES (?, ?, NOW())',
      [userId, recipe_id]
    );

    // 추천 동기화 (에러 무시)
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

  console.log(`[DEBUG] 찜 삭제 요청: User ${userId}, Recipe ${recipeId}`);

  try {
    // [수정] recipe_id 기준 삭제
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