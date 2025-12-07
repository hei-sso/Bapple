// controllers/fridgeController.js
import db from '../db.js';
import { syncUserToBatch } from '../services/recommendationService.js';

// [Helper] 유저의 기본 냉장고 ID 찾기
const findDefaultFridge = async (userId) => {
  const [rows] = await db.query(
    'SELECT id FROM fridge WHERE owner_user_id = ? AND is_default = 1 LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0].id;
};

// 1. 내 냉장고 재료 조회 (GET /fridge/my)
export const getMyIngredients = async (req, res) => {
  const userId = req.user.user_id;
  console.log(`[DEBUG] [GET] 내 냉장고 조회 요청 (User: ${userId})`);

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) {
      return res.status(404).json({ message: '기본 냉장고를 찾을 수 없습니다.' });
    }

    // [수정] i.icon_image 컬럼 제거 (DB에 없어서 에러 발생함)
    const query = `
      SELECT 
        i.id AS id,                  
        i.name AS name,              
        i.category_id AS category,   
        -- i.icon_image AS image,    <-- 이 부분이 에러 원인이라 주석 처리했습니다.
        NULL AS image,               -- 프론트엔드 에러 방지를 위해 일단 NULL로 보냄
        fi.quantity,
        fi.unit,
        fi.expire_date,
        fi.created_at
      FROM fridge_ingredient fi
      JOIN ingredient i ON fi.ingredient_id = i.id
      WHERE fi.fridge_id = ?
      ORDER BY fi.created_at DESC
    `;
    
    const [rows] = await db.query(query, [fridgeId]);
    console.log(`[DEBUG] 냉장고 재료 ${rows.length}개 로드 성공`);
    
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error('[ERROR] 내 냉장고 조회 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 2. 냉장고에 재료 추가 (POST /fridge/my)
export const addIngredientToMyFridge = async (req, res) => {
  const userId = req.user.user_id;
  const ingredient_id = req.body.id || req.body.ingredient_id;
  let { quantity, unit, expire_date } = req.body;

  if (!quantity) quantity = 1;
  if (!unit) unit = '개';
  if (!expire_date) {
    const today = new Date();
    today.setDate(today.getDate() + 14); 
    expire_date = today.toISOString().split('T')[0];
  }

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) return res.status(404).json({ message: '기본 냉장고 없음' });

    const [exists] = await db.query(
      'SELECT id FROM fridge_ingredient WHERE fridge_id = ? AND ingredient_id = ?',
      [fridgeId, ingredient_id]
    );

    if (exists.length > 0) {
        return res.status(200).json({ success: true, message: '이미 냉장고에 있는 재료입니다.' });
    }

    await db.query(`
      INSERT INTO fridge_ingredient 
      (fridge_id, ingredient_id, quantity, unit, expire_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'fresh', NOW())
    `, [fridgeId, ingredient_id, quantity, unit, expire_date]);

    try { syncUserToBatch(userId); } catch (e) { console.warn('동기화 실패:', e.message); }

    res.status(201).json({ success: true, message: '추가되었습니다.' });
  } catch (error) {
    console.error('[ERROR] 재료 추가 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 3. 냉장고 재료 삭제 (DELETE /fridge/my/:ingredientId)
export const removeIngredientFromMyFridge = async (req, res) => {
  const userId = req.user.user_id;
  const { ingredientId } = req.params; 

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) return res.status(404).json({ message: '기본 냉장고 없음' });

    const [result] = await db.query(`
      DELETE FROM fridge_ingredient 
      WHERE fridge_id = ? AND ingredient_id = ?
    `, [fridgeId, ingredientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '냉장고에 없는 재료입니다.' });
    }

    try { syncUserToBatch(userId); } catch (e) { console.warn('동기화 실패:', e.message); }

    res.status(200).json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    console.error('[ERROR] 재료 삭제 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 4. 전체 재료 목록 조회 (GET /fridge/ingredients)
export const getAllIngredients = async (req, res) => {
    try {
        // [수정] 여기도 i.icon_image 제거
        const query = `
            SELECT i.id, i.name, i.category_id as category, NULL as image
            FROM ingredient i
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
};
