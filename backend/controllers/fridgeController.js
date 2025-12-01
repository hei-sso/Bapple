import db from '../db.js';


// 1. 냉장고에 재료 담기 (매핑 테이블 INSERT)
export const addIngredient = async (req, res) => {
  const { fridgeId, ingredientId, quantity, unit, expireDate } = req.body;
  
  // [DEBUG] 1. 요청 데이터 확인
  console.log(`\n[DEBUG] 🟢 재료 추가 요청 시작`);
  console.log(`[DEBUG]    - 요청자(User ID): ${req.user ? req.user.user_id : '토큰 없음'}`);
  console.log(`[DEBUG]    - 대상 냉장고(Fridge ID): ${fridgeId}`);
  console.log(`[DEBUG]    - 추가할 재료(Ing ID): ${ingredientId}`);
  console.log(`[DEBUG]    - 상세 정보: ${quantity}${unit}, 유통기한: ${expireDate}`);

  const userId = req.user.user_id; 

  try {
    // [DEBUG] 2. 권한 체크 시작
    console.log(`[DEBUG] 🔍 권한 확인 중... (Fridge: ${fridgeId}, User: ${userId})`);
    
    const [auth] = await db.query(`
      SELECT 1 FROM fridge WHERE fridge_id = ? AND owner_user_id = ?
      UNION
      SELECT 1 FROM fridge_share WHERE fridge_id = ? AND user_id = ? AND (role = 'owner' OR role = 'editor')
    `, [fridgeId, userId, fridgeId, userId]);

    if (auth.length === 0) {
      console.log(`[DEBUG] 🚨 권한 거부됨: 이 냉장고의 주인이 아니거나 편집 권한이 없음.`);
      return res.status(403).json({ message: '권한 없음' });
    }
    console.log(`[DEBUG] ✅ 권한 확인 완료. (편집 가능)`);

    // [DEBUG] 3. DB Insert 실행
    console.log(`[DEBUG] 💾 DB 저장 시도 (Table: fridge_ingredient)...`);
    
    const [result] = await db.query(`
      INSERT INTO fridge_ingredient 
      (fridge_id, ingredient_id, quantity, unit, expire_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'fresh', NOW())
    `, [fridgeId, ingredientId, quantity, unit, expireDate]);

    console.log(`[DEBUG] ✅ DB 저장 성공! (Insert ID: ${result.insertId})`);
    console.log(`[DEBUG] 🟢 재료 추가 요청 종료\n`);

    res.status(201).json({ success: true, message: '재료 담기 완료' });

  } catch (error) {
    console.error(`[DEBUG] ❌ 재료 담기 중 에러 발생:`);
    console.error(error);
    res.status(500).json({ message: '서버 오류' });
  }
};


// 2. 냉장고 재료 삭제 (매핑 해제)
export const deleteIngredient = async (req, res) => {
  const { fridgeIngredientId } = req.params; 
  const userId = req.user.user_id;

  // [DEBUG] 1. 요청 확인
  console.log(`\n[DEBUG] 🔴 재료 삭제 요청 시작`);
  console.log(`[DEBUG]    - 요청자: ${userId}`);
  console.log(`[DEBUG]    - 삭제할 항목 ID (PK): ${fridgeIngredientId}`);

  try {
    // [DEBUG] 2. 해당 재료가 어느 냉장고 것인지 조회
    console.log(`[DEBUG] 🔍 삭제 대상 조회 중...`);
    const [target] = await db.query('SELECT fridge_id FROM fridge_ingredient WHERE id = ?', [fridgeIngredientId]);
    
    if (target.length === 0) {
      console.log(`[DEBUG] 🚨 삭제 대상 없음: ID ${fridgeIngredientId}에 해당하는 데이터가 DB에 없음.`);
      return res.status(404).json({ message: '재료 없음' });
    }
    
    const fridgeId = target[0].fridge_id;
    console.log(`[DEBUG]    - 소속 냉장고 ID 확인됨: ${fridgeId}`);

    // [DEBUG] 3. 권한 확인
    console.log(`[DEBUG] 🔍 권한 확인 중...`);
    const [auth] = await db.query(`
      SELECT 1 FROM fridge WHERE fridge_id = ? AND owner_user_id = ?
      UNION
      SELECT 1 FROM fridge_share WHERE fridge_id = ? AND user_id = ? AND (role = 'owner' OR role = 'editor')
    `, [fridgeId, userId, fridgeId, userId]);

    if (auth.length === 0) {
      console.log(`[DEBUG] 🚨 권한 없음.`);
      return res.status(403).json({ message: '권한 없음' });
    }

    // [DEBUG] 4. 삭제 실행
    console.log(`[DEBUG] 🗑️ DB 삭제 실행...`);
    const [result] = await db.query('DELETE FROM fridge_ingredient WHERE id = ?', [fridgeIngredientId]);
    
    console.log(`[DEBUG] ✅ 삭제 완료. (Affected Rows: ${result.affectedRows})`);
    console.log(`[DEBUG] 🔴 재료 삭제 요청 종료\n`);
    
    res.status(200).json({ success: true, message: '삭제 완료' });

  } catch (error) {
    console.error(`[DEBUG] ❌ 삭제 중 에러 발생:`);
    console.error(error);
    res.status(500).json({ message: '삭제 실패' });
  }
};


// 3. 내 냉장고 재료 조회 (JOIN)
export const getIngredients = async (req, res) => {
  const { fridgeId } = req.params;
  const userId = req.user.user_id;

  // [DEBUG] 1. 요청 확인
  console.log(`\n[DEBUG] 🔵 재료 목록 조회 요청 시작`);
  console.log(`[DEBUG]    - 요청자: ${userId}`);
  console.log(`[DEBUG]    - 대상 냉장고: ${fridgeId}`);

  try {
    // [DEBUG] 2. 권한 확인
    console.log(`[DEBUG] 🔍 조회 권한 확인 중...`);
    const [auth] = await db.query(`
      SELECT 1 FROM fridge WHERE fridge_id = ? AND owner_user_id = ?
      UNION
      SELECT 1 FROM fridge_share WHERE fridge_id = ? AND user_id = ?
    `, [fridgeId, userId, fridgeId, userId]);

    if (auth.length === 0) {
      console.log(`[DEBUG] 🚨 권한 없음: 내 냉장고도 아니고 공유받은 것도 아님.`);
      return res.status(403).json({ message: '권한 없음' });
    }
    console.log(`[DEBUG] ✅ 권한 확인 완료.`);

    // [DEBUG] 3. 목록 조회 (JOIN 쿼리)
    console.log(`[DEBUG] 📡 DB 조회 (JOIN ingredient)...`);
    const query = `
      SELECT 
        fi.id AS key_id,           
        i.name AS ingredient_name, 
        i.category_id,               
        fi.quantity,               
        fi.unit,                   
        fi.expire_date,            
        fi.status,                   
        DATEDIFF(fi.expire_date, NOW()) AS d_day 
      FROM fridge_ingredient fi
      JOIN ingredient i ON fi.ingredient_id = i.id
      WHERE fi.fridge_id = ?
    `;
    
    const [rows] = await db.query(query, [fridgeId]);
    console.log(`[DEBUG] ✅ 조회 완료. 총 ${rows.length}개의 재료 발견.`);
    // console.log(`[DEBUG]    - 데이터 미리보기:`, rows[0]); // 필요시 주석 해제

    console.log(`[DEBUG] 🔵 재료 목록 조회 요청 종료\n`);
    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error(`[DEBUG] ❌ 조회 중 에러 발생:`);
    console.error(error);
    res.status(500).json({ message: '조회 실패' });
  }
};