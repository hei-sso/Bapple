import db from '../db.js';

// 유저의 최신 상태(알러지, 질병, 냉장고 재료)를 모아 user_recommendation_batch 테이블에 저장하는 함수
export const syncUserToBatch = async (user_id) => {
  try {
    // 1. [핵심] 기존 데이터 삭제 (중복 방지)
    // 이전에 저장된 유저의 상태를 지워야 DB 용량이 낭비되지 않습니다.
    await db.query('DELETE FROM user_recommendation_batch WHERE user_id = ?', [user_id]);

    // 2. 최신 데이터 수집 및 저장 (한방 쿼리)
    const query = `
      INSERT INTO user_recommendation_batch 
      (user_id, diseases_json, allergies_json, fridge_ings_json, created_at)
      SELECT 
        ?, -- user_id (1번째 파라미터)
        
        -- (1) 질병 정보
        COALESCE(
          (SELECT JSON_ARRAYAGG(health_condition_id) 
           FROM user_health_condition 
           WHERE user_id = ?), -- (2번째 파라미터)
        '[]'),
        
        -- (2) 알러지 정보
        COALESCE(
          (SELECT JSON_ARRAYAGG(allergy_id) 
           FROM user_allergy 
           WHERE user_id = ?), -- (3번째 파라미터)
        '[]'),
        
        -- (3) [수정됨] 내 냉장고 재료 정보 (ID 대신 '이름' 저장)
        COALESCE(
          (SELECT JSON_ARRAYAGG(i.name)   -- [핵심 변경] fi.ingredient_id -> i.name
           FROM fridge_ingredient fi 
           JOIN fridge f ON fi.fridge_id = f.id 
           JOIN ingredient i ON fi.ingredient_id = i.id -- [추가] 재료 이름을 가져오기 위해 JOIN
           WHERE f.owner_user_id = ? AND f.is_default = 1), -- (4번째 파라미터)
        '[]'),
        
        NOW() -- created_at (현재 시간)
    `;

    // userId가 쿼리 내 ? 자리에 총 4번 들어갑니다.
    await db.query(query, [user_id, user_id, user_id, user_id]);
    
    console.log(`[Batch Sync] User ${user_id} 데이터 동기화 완료 (재료 이름으로 갱신됨)`);

  } catch (error) {
    // 추천 데이터 저장이 실패하더라도 메인 기능(재료 추가 등)은 멈추면 안 되므로 로그만 남깁니다.
    console.error(`[Batch Sync Error] User ${user_id} 동기화 실패:`, error);
  }
};
