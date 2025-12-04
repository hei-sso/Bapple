import db from '../db.js';

//유저의 최신 상태(알러지, 질병, 냉장고 재료)를 모아 user_recommendation_batch 테이블에 저장하는 함수
export const syncUserToBatch = async (userId) => {
  try {
    const query = `
      INSERT INTO user_recommendation_batch 
      (user_id, diseases_json, allergies_json, fridge_ings_json)
      SELECT 
        ?, -- user_id (첫 번째 파라미터)
        
        -- 1. 질병 정보 (데이터 없으면 빈 배열 '[]' 로 저장)
        COALESCE(
          (SELECT JSON_ARRAYAGG(health_condition_id) 
           FROM user_health_condition 
           WHERE user_id = ?), 
        '[]'),
        
        -- 2. 알러지 정보
        COALESCE(
          (SELECT JSON_ARRAYAGG(allergy_id) 
           FROM user_allergy 
           WHERE user_id = ?), 
        '[]'),
        
        -- 3. 내 냉장고 재료 정보 (본인 소유 냉장고 기준)
        COALESCE(
          (SELECT JSON_ARRAYAGG(fi.ingredient_id) 
           FROM fridge_ingredient fi 
           JOIN fridge f ON fi.fridge_id = f.id 
           WHERE f.owner_user_id = ?), 
        '[]')
    `;

    // userId가 쿼리 내 ? 자리에 총 4번 들어갑니다.
    await db.query(query, [userId, userId, userId, userId]);
    
    console.log(`[Batch Sync] User ${userId} 데이터 동기화 완료 (Batch Table 저장)`);

  } catch (error) {
    // 추천 데이터 저장이 실패하더라도 메인 기능(재료 추가 등)은 멈추면 안되므로 로그만 남깁니다.
    console.error(`[Batch Sync Error] User ${userId} 동기화 실패:`, error);
  }
};