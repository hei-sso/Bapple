import db from '../db.js';
// [추가됨] 추천 데이터 동기화 서비스 임포트
import { syncUserToBatch } from '../services/recommendationService.js';

// [Helper] 유저의 기본 냉장고 ID 찾기 (로그 포함)
const findDefaultFridge = async (userId) => {
  console.log(`[DEBUG] (Helper) User ID ${userId}의 기본 냉장고 찾는 중...`);
  const [rows] = await db.query(
    'SELECT id FROM fridge WHERE owner_user_id = ? AND is_default = 1 LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    console.warn(`[DEBUG] (Helper) User ID ${userId}의 기본 냉장고가 없습니다.`);
    return null;
  }
  
  console.log(`[DEBUG] (Helper) 기본 냉장고 발견: Fridge ID ${rows[0].id}`);
  return rows[0].id;
};


// 1. 내 냉장고 재료 조회 (GET /fridge/my)
export const getMyIngredients = async (req, res) => {
  const userId = req.user.user_id;

  console.log(`\n========================================`);
  console.log(`[DEBUG] [GET] 내 냉장고 조회 요청 시작`);
  console.log(`[DEBUG] 요청 User ID: ${userId}`);

  try {
    // 1. 기본 냉장고 ID 조회
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) {
      console.log(`[DEBUG] 기본 냉장고 없음 -> 404 응답`);
      return res.status(404).json({ message: '기본 냉장고를 찾을 수 없습니다.' });
    }

    // 2. 재료 목록 조회 (DB Query)
    console.log(`[DEBUG] DB 조회 쿼리 실행 (Target Fridge: ${fridgeId})`);
    
    // API 명세에 맞춰 필요한 컬럼만 정확히 조회
    const query = `
      SELECT 
        fi.id AS key_id,            
        i.id AS ingredient_id,      
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
    console.log(`[DEBUG] 조회 결과: 총 ${rows.length}개의 재료 발견`);
    
    res.status(200).json({ success: true, data: rows });
    console.log(`[DEBUG] [GET] 조회 성공 응답 완료`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error(`[DEBUG] [GET] 조회 중 에러 발생:`, error);
    res.status(500).json({ message: '서버 오류' });
  }
};


// 2. 냉장고에 재료 추가 (POST /fridge/my)
export const addIngredientToMyFridge = async (req, res) => {
  const userId = req.user.user_id;
  let { ingredient_id, quantity, unit, expire_date } = req.body;

  console.log(`\n========================================`);
  console.log(`[DEBUG] [POST] 재료 추가 요청 시작`);
  console.log(`[DEBUG] 요청 User ID: ${userId}`);
  console.log(`[DEBUG] 요청 데이터(Body):`, req.body);

  // [기본값 설정 로직 및 로그]
  const logs = [];
  if (!quantity) { quantity = 1; logs.push("수량(1)"); }
  if (!unit) { unit = '개'; logs.push("단위(개)"); }
  if (!expire_date) {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    expire_date = today.toISOString().split('T')[0];
    logs.push(`유통기한(+14일: ${expire_date})`);
  }

  if (logs.length > 0) {
    console.log(`[DEBUG] 누락된 값 기본값 자동 설정: [${logs.join(', ')}]`);
  }
  console.log(`[DEBUG] 최종 저장될 데이터: { id: ${ingredient_id}, Qty: ${quantity}${unit}, Exp: ${expire_date} }`);

  try {
    // 1. 기본 냉장고 찾기
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) {
      console.log(`[DEBUG] 기본 냉장고 없음 -> 404 응답`);
      return res.status(404).json({ message: '기본 냉장고가 없습니다.' });
    }

    // 2. 저장 실행 (DB Insert)
    console.log(`[DEBUG] DB INSERT 실행 중...`);
    const [result] = await db.query(`
      INSERT INTO fridge_ingredient 
      (fridge_id, ingredient_id, quantity, unit, expire_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'fresh', NOW())
    `, [fridgeId, ingredient_id, quantity, unit, expire_date]);

    console.log(`[DEBUG] DB 저장 성공 (Insert ID: ${result.insertId})`);

    // 3. 추천 데이터 동기화
    console.log(`[DEBUG] 추천 시스템 데이터 동기화 요청 (syncUserToBatch)...`);
    syncUserToBatch(userId); // await 없이 비동기 실행 (속도 최적화)

    res.status(201).json({ success: true, message: '재료가 추가되었습니다.' });
    console.log(`[DEBUG] [POST] 추가 성공 응답 완료`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error(`[DEBUG] [POST] 추가 중 에러 발생:`, error);
    res.status(500).json({ message: '재료 추가 실패' });
  }
};


// 3. 냉장고 재료 삭제 (DELETE /fridge/my/:ingredientId)
// 주의: 여기서 param으로 받는건 '재료 원본 ID'(예: 사과 ID)입니다.
export const removeIngredientFromMyFridge = async (req, res) => {
  const userId = req.user.user_id;
  const { ingredientId } = req.params; 

  console.log(`\n========================================`);
  console.log(`[DEBUG] [DELETE] 재료 삭제 요청 시작`);
  console.log(`[DEBUG] 요청 User ID: ${userId}`);
  console.log(`[DEBUG] 삭제할 재료 ID (IngredientID): ${ingredientId}`);

  try {
    // 1. 기본 냉장고 찾기
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) {
      return res.status(404).json({ message: '기본 냉장고가 없습니다.' });
    }

    // 2. 삭제 실행
    // 프론트엔드에서는 구체적인 fridge_ingredient_id를 모르고 재료 ID만 보내므로
    // 해당 냉장고에 있는 해당 재료 중 '하나'를 삭제합니다. (LIMIT 1)
    console.log(`[DEBUG] DB DELETE 실행 (Fridge: ${fridgeId}, Ingredient: ${ingredientId})`);
    
    const [result] = await db.query(`
      DELETE FROM fridge_ingredient 
      WHERE fridge_id = ? AND ingredient_id = ?
      LIMIT 1
    `, [fridgeId, ingredientId]);

    if (result.affectedRows === 0) {
      console.log(`[DEBUG] 삭제 실패: 해당 재료가 냉장고에 없음.`);
      return res.status(404).json({ message: '해당 재료가 냉장고에 없습니다.' });
    }

    console.log(`[DEBUG] DB 삭제 성공 (Affected Rows: ${result.affectedRows})`);

    // 3. 추천 데이터 동기화
    console.log(`[DEBUG] 추천 시스템 데이터 동기화 요청...`);
    syncUserToBatch(userId);

    res.status(200).json({ success: true, message: '삭제 완료' });
    console.log(`[DEBUG] [DELETE] 삭제 성공 응답 완료`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error(`[DEBUG] [DELETE] 삭제 중 에러 발생:`, error);
    res.status(500).json({ message: '삭제 실패' });
  }
};