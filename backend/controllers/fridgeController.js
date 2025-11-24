import db from '../db.js';

// 1. 재료 추가
export const addIngredient = async (req, res) => {
  const { fridgeId, name, quantity, unit, categoryId, expireDate } = req.body;
  const userId = req.user.id;

  try {
    // [보안 로직] 내 냉장고거나, 공유받은 냉장고인지 확인
    const [auth] = await db.query(`
      SELECT 1 FROM fridge WHERE id = ? AND owner_user_id = ?
      UNION 
      SELECT 1 FROM fridge_share WHERE fridge_id = ? AND user_id = ? AND role = 'editor'
    `, [fridgeId, userId, fridgeId, userId]);

    if (auth.length === 0) return res.status(403).json({ message: '권한 없음' });

    await db.query(`
      INSERT INTO ingredient 
      (fridge_id, name, quantity, unit, category_id, expire_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'fresh', NOW())
    `, [fridgeId, name, quantity, unit, categoryId, expireDate]);

    res.status(201).json({ success: true, message: '재료 추가 완료' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '재료 추가 실패' });
  }
};

// 2. 재료 삭제
export const deleteIngredient = async (req, res) => {
  const { ingredientId } = req.params;
  const userId = req.user.id;

  try {
    // 재료가 어느 냉장고에 있는지 확인
    const [ing] = await db.query('SELECT fridge_id FROM ingredient WHERE id = ?', [ingredientId]);
    if (ing.length === 0) return res.status(404).json({ message: '재료 없음' });
    
    const fridgeId = ing[0].fridge_id;

    // [보안 로직] 권한 체크
    const [auth] = await db.query(`
      SELECT 1 FROM fridge WHERE id = ? AND owner_user_id = ?
      UNION 
      SELECT 1 FROM fridge_share WHERE fridge_id = ? AND user_id = ? AND role = 'editor'
    `, [fridgeId, userId, fridgeId, userId]);

    if (auth.length === 0) return res.status(403).json({ message: '권한 없음' });

    await db.query('DELETE FROM ingredient WHERE id = ?', [ingredientId]);
    res.status(200).json({ success: true, message: '삭제 완료' });
  } catch (error) {
    res.status(500).json({ message: '삭제 실패' });
  }
};

// 3. 조회
export const getIngredients = async (req, res) => {
  const { fridgeId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ingredient WHERE fridge_id = ?', [fridgeId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ message: '조회 실패' });
  }
};