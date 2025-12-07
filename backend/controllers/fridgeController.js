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
// [중요] 프론트엔드 코드 구조(Ingredient 타입)에 맞춰 컬럼명을 매핑합니다.
export const getMyIngredients = async (req, res) => {
  const userId = req.user.user_id;
  console.log(`[DEBUG] [GET] 내 냉장고 조회 요청 (User: ${userId})`);

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) {
      return res.status(404).json({ message: '기본 냉장고를 찾을 수 없습니다.' });
    }

    // [핵심] JOIN 쿼리
    // 1. fridge_ingredient 테이블과 ingredient 테이블을 JOIN
    // 2. ingredient.category_id를 'category'라는 이름(Alias)으로 가져옴 (프론트 호환)
    // 3. ingredient.id를 'id'로 가져옴 (프론트 비교 로직 호환)
    const query = `
      SELECT 
        i.id AS id,                  -- 재료 원본 ID (프론트엔드 비교용)
        i.name AS name,              -- 재료 이름
        i.category_id AS category,   -- [중요] 프론트엔드 그룹화를 위한 카테고리 ID
        i.icon_image AS image,       -- (옵션) 이미지 URL
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
  // 프론트엔드 Ingredient 객체에는 id가 재료 ID입니다.
  // 요청 바디로 { id: 1, name: '...', category: '...' } 등이 올 수 있으므로 id를 ingredient_id로 사용
  const ingredient_id = req.body.id || req.body.ingredient_id;
  let { quantity, unit, expire_date } = req.body;

  // 기본값 설정
  if (!quantity) quantity = 1;
  if (!unit) unit = '개';
  if (!expire_date) {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 기본 2주
    expire_date = today.toISOString().split('T')[0];
  }

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) return res.status(404).json({ message: '기본 냉장고 없음' });

    // 중복 방지 (이미 냉장고에 있으면 수량만 늘리거나 무시하는 정책이 일반적이나, 여기선 중복 insert 에러 방지)
    const [exists] = await db.query(
      'SELECT id FROM fridge_ingredient WHERE fridge_id = ? AND ingredient_id = ?',
      [fridgeId, ingredient_id]
    );

    if (exists.length > 0) {
        // 이미 있으면 업데이트하거나 메시지 반환 (여기서는 성공으로 간주)
        return res.status(200).json({ success: true, message: '이미 냉장고에 있는 재료입니다.' });
    }

    await db.query(`
      INSERT INTO fridge_ingredient 
      (fridge_id, ingredient_id, quantity, unit, expire_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'fresh', NOW())
    `, [fridgeId, ingredient_id, quantity, unit, expire_date]);

    // 추천 데이터 동기화
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
  // 프론트엔드 removeIngredient(ing.id)는 재료 ID를 보냅니다.
  const { ingredientId } = req.params; 

  try {
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) return res.status(404).json({ message: '기본 냉장고 없음' });

    // [중요] ingredient_id를 기준으로 삭제합니다.
    const [result] = await db.query(`
      DELETE FROM fridge_ingredient 
      WHERE fridge_id = ? AND ingredient_id = ?
    `, [fridgeId, ingredientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '냉장고에 없는 재료입니다.' });
    }

    // 추천 데이터 동기화
    try { syncUserToBatch(userId); } catch (e) { console.warn('동기화 실패:', e.message); }

    res.status(200).json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    console.error('[ERROR] 재료 삭제 실패:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 4. 전체 재료 목록 조회 (GET /fridge/ingredients) - 재료 추가 모달용
export const getAllIngredients = async (req, res) => {
    try {
        // 카테고리별 그룹화 로직 등 기존과 동일하게 유지하거나,
        // 프론트엔드가 단순 리스트를 원하면 SELECT * FROM ingredient
        // 여기서는 기존 로직(카테고리 조인 등)이 있다고 가정합니다.
        // 편의상 단순 리스트 반환 예시:
        const query = `
            SELECT i.id, i.name, i.category_id as category, i.icon_image
            FROM ingredient i
        `;
        const [rows] = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error' });
    }
};