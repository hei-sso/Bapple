// controllers/fridgeController.js

import db from '../db.js';
// [추가됨] 추천 데이터 동기화 서비스 임포트
import { syncUserToBatch } from '../services/recommendationService.js';

// [Helper] 유저의 기본 냉장고 ID 찾기
const findDefaultFridge = async (userId) => {
  // console.log(`[DEBUG] (Helper) User ID ${userId}의 기본 냉장고 찾는 중...`);
  const [rows] = await db.query(
    'SELECT id FROM fridge WHERE owner_user_id = ? AND is_default = 1 LIMIT 1',
    [userId]
  );

  if (rows.length === 0) {
    console.warn(`[DEBUG] (Helper) User ID ${userId}의 기본 냉장고가 없습니다.`);
    return null;
  }
  
  return rows[0].id;
};

// 0. [수정됨] 전체 재료 목록 조회 (GET /fridge/ingredients)
export const getAllIngredients = async (req, res) => {
  console.log(`[DEBUG] [GET] 전체 재료 목록 조회 요청`);
  try {
    // 카테고리별로 재료를 묶어서 보내주기 위해 JOIN 쿼리 사용
    // (만약 카테고리 테이블이 없다면 그냥 ingredient만 조회하세요)
    const query = `
      SELECT 
        c.category_id, 
        c.category_name, 
        i.id as ingredient_id, 
        i.name as ingredient_name
      FROM ingredient_category c
      JOIN ingredient i ON c.category_id = i.category_id
      ORDER BY c.category_id ASC, i.name ASC
    `;
    
    const [rows] = await db.query(query);
    console.log(`[DEBUG] 재료 데이터 ${rows.length}개 로드 성공`);
    
    // [핵심 수정] 프론트엔드가 { id, name }을 기대하므로 변수명을 맞춰줍니다.
    const groupedData = rows.reduce((acc, row) => {
      // 이미 생성된 카테고리인지 확인 (id로 찾기)
      let category = acc.find(c => c.id === row.category_id);
      
      if (!category) {
        category = {
          id: row.category_id,       // category_id -> id 로 변경
          name: row.category_name,   // category_name -> name 로 변경
          ingredients: []
        };
        acc.push(category);
      }
      
     // 재료 정보 추가
      if (row.ingredient_id) {
          category.ingredients.push({
             id: row.ingredient_id,
             name: row.ingredient_name
          });
      }
      return acc;
    }, []);

    res.status(200).json({ success: true, data: groupedData });
  } catch (error) {
    console.error(`[DEBUG] [GET] 전체 재료 조회 실패:`, error);
    res.status(500).json({ message: '서버 오류' });
  }
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
        fi.id AS id,                 
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
  
  // 기본값 설정
  if (!quantity) quantity = 1;
  if (!unit) unit = '개';
  if (!expire_date) {
    const today = new Date();
    today.setDate(today.getDate() + 14);
    expire_date = today.toISOString().split('T')[0];
    console.log(`[DEBUG] 유통기한 자동 설정 (+14일): ${expire_date}`);
  }

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

    // ✅ 추천 데이터 동기화
    console.log(`[DEBUG] 추천 시스템 데이터 동기화 요청...`);
    syncUserToBatch(userId); 

    res.status(201).json({ success: true, message: '재료가 추가되었습니다.' });
    console.log(`[DEBUG] [POST] 추가 성공 응답 완료`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error(`[DEBUG] [POST] 추가 중 에러 발생:`, error);
    res.status(500).json({ message: '재료 추가 실패' });
  }
};

// 3. 냉장고 재료 삭제 (DELETE /fridge/my/:ingredientId)
// 설명: 냉장고 테이블의 고유 ID(PK)를 받아 해당 항목을 삭제합니다.
export const removeIngredientFromMyFridge = async (req, res) => {
  const userId = req.user.user_id;
  const { ingredientId } = req.params; 

  console.log(`\n========================================`);
  console.log(`[DEBUG] [DELETE] 재료 삭제 요청 시작. ID: ${ingredientId}`);

  try {
    // 1. 기본 냉장고 찾기
    const fridgeId = await findDefaultFridge(userId);
    if (!fridgeId) return res.status(404).json({ message: '기본 냉장고가 없습니다.' });

    // 해당 냉장고에 있는 해당 재료 삭제 (PK로 삭제)
    const [result] = await db.query(`
      DELETE FROM fridge_ingredient 
      WHERE fridge_id = ? AND id = ?
      LIMIT 1
    `, [fridgeId, ingredientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 재료가 냉장고에 없습니다.' });
    }

    // ✅ 추천 데이터 동기화
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