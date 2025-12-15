// controllers/recipeController.js
import db from '../db.js';
import { syncUserToBatch } from '../services/recommendationService.js';

// 1. 전체 레시피 조회 (GET /recipe/all)
export const getAllRecipes = async (req, res) => {
  console.log('[DEBUG] [GET] 전체 레시피 조회 요청');
  try {
    const query = `SELECT * FROM recipe`;
    const [recipes] = await db.query(query);
    console.log(`[DEBUG] 레시피 ${recipes.length}개 로드 성공`);

    // [전체] 카테고리 데이터 생성
    // 프론트엔드가 'id', 'category'를 쓰므로 변환해서 넣어줍니다.
    const allRecipesMapped = recipes.map(r => ({
      id: r.recipe_id,          // recipe_id -> id 로 변환
      name: r.name,
      category: r.cuisine_type, // cuisine_type -> category 로 변환
      img_url: r.img_url
    }));

    const result = [{
      id: 'all',
      name: '전체',
      recipes: allRecipesMapped
    }];

    // [종류별] 카테고리 분류
    const categoryMap = {};

    recipes.forEach(recipe => {
      const type = recipe.cuisine_type; 
      
      if (type) {
        const cleanType = type.trim();

        if (!categoryMap[cleanType]) {
          categoryMap[cleanType] = [];
        }

        // 여기서도 프론트엔드 변수명에 맞춰서 push 합니다.
        categoryMap[cleanType].push({
          id: recipe.recipe_id,          // [중요] 프론트엔드는 item.id를 찾음
          name: recipe.name,
          category: recipe.cuisine_type, // [중요] 프론트엔드는 item.category를 찾음
          img_url: recipe.img_url
        });
      }
    });

    Object.keys(categoryMap).forEach(typeName => {
      result.push({
        id: typeName,   
        name: typeName, 
        recipes: categoryMap[typeName]
      });
    });

    res.status(200).json({ success: true, data: result });

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
    // [중요] SQL 단계에서부터 이름을 'id', 'category'로 바꿔서 가져옵니다.
    const query = `
      SELECT 
        r.recipe_id AS id,        -- 프론트엔드: item.id
        r.name, 
        r.img_url, 
        r.cuisine_type AS category, -- 프론트엔드: item.category
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
  // 프론트엔드가 { id: "..." } 로 보내줄 수도 있고 { recipe_id: "..." } 로 보낼 수도 있습니다.
  // 둘 다 받도록 처리합니다.
  const recipe_id = req.body.recipe_id || req.body.id; 

  console.log(`[DEBUG] 찜 추가 요청: User ${userId}, Recipe ${recipe_id}`);

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

  console.log(`[DEBUG] 찜 삭제 요청: User ${userId}, Recipe ${recipeId}`);

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

// 5. [추가됨] 특정 레시피 상세 정보 로드 (GET /recipe/detail/:recipeId)
export const getRecipeDetail = async (req, res) => {
  const { recipeId } = req.params;
  console.log(`[DEBUG] [GET] 레시피 상세 조회 요청 (ID: ${recipeId})`);

  try {
    // DB에서 해당 레시피 ID로 조회
    const query = `SELECT * FROM recipe WHERE recipe_id = ?`;
    const [rows] = await db.query(query, [recipeId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '레시피를 찾을 수 없습니다.' });
    }

    const recipe = rows[0];

    // 프론트엔드 형식(RecipeDetail)에 맞게 데이터 매핑
    const result = {
      id: recipe.recipe_id,           // 프론트엔드: id
      name: recipe.name,
      category: recipe.cuisine_type,  // 프론트엔드: category
      img_url: recipe.img_url,
      // DB에 칼럼이 있다면 아래와 같이 추가 매핑 (없으면 undefined로 나감)
      description: recipe.description,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      calories: recipe.calories,
      // ingredients나 instructions 테이블이 별도로 있다면 여기서 추가 쿼리 후 합쳐야 함
      // 현재는 recipe 테이블의 정보를 반환
    };

    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('[ERROR] 레시피 상세 조회 실패:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};