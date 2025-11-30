// user_recommend_item에 있는 레시피들을 UI에 다 띄우면 다시 AI 서버를 호출해서 새 item들로 채우기

import axios from "axios";
import defaults from "../config/recommendDefaults";

const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL;

/**
 * 같은 batch에 새로운 추천 후보들을 채워 넣는 헬퍼
 * - 같은 batch에 이미 있던 recipe_id 는 제외
 * - recipe 테이블에 없는 recipe_id 는 제외 (FK 에러 방지)
 * - rank_no 는 기존 max_rank 뒤에 이어붙임
 *
 * @param {PromisePoolConnection} conn - mysql2/promise 커넥션
 * @param {number} batchId
 * @returns {Promise<number>} 실제로 INSERT 된 row 개수
 */
export async function refillRecommendationsForBatch(conn, batchId) {
    // 1) batch 정보에서 diseases/allergies/fridge_ings 가져오기
    const [batchRows] = await conn.query(
        `
        SELECT diseases_json, allergies_json, fridge_ings_json 
        FROM user_recommendation_batch 
        WHERE id = ?
        `,
        [batchId]
    );
    
    if (batchRows.length == 0){
        console.warn("refill 실패: batch를 찾을 수 없음", batchId);
        return 0;
    }

    const batch = batchRows[0];
    const diseases = batch.diseases_json ? JSON.parse(batch.diseases_json) : [];
    const allergies = batch.allergies_json ? JSON.parse(batch.allergies_json) : [];
    const fridge_ings = batch.fridge_ings_json ? JSON.parse(batch.fridge_ings_json) : [];

    // 2) AI 서버에 보낼 payload
    const aiPayload = {
    cuisine: defaults.cuisine,
    diet: defaults.diet,
    diseases,
    tags: defaults.tags,
    allergies,
    fridge_ings,
    days: defaults.days,
    meals_per_day: defaults.meals_per_day,
    top_k: defaults.top_k,
  };

  console.log(">>> [refill] AI payload:", aiPayload);

  const aiRes = await axios.post(
    `${AI_BASE_URL}/recommend/week`,
    aiPayload,
    { timeout: 20000 }
  );

  const items = aiRes.data.items || [];
  console.log(">>> [refill] AI items length:", items.length);
  if (items.length === 0) return 0;

  // 3) recipe_id 기준 중복 제거
  const seen = new Set();
  const uniqueItems = [];
  for (const item of items) {
    if (!item.recipe_id) continue;
    if (seen.has(item.recipe_id)) continue;
    seen.add(item.recipe_id);
    uniqueItems.push(item);
  }
  console.log(">>> [refill] uniqueItems length:", uniqueItems.length);
  if (uniqueItems.length === 0) return 0;

  // 4) 이미 이 batch에 있는 recipe_id 제외
  const [existingRows] = await conn.query(
    `
      SELECT recipe_id 
      FROM user_recommendation_item 
      WHERE batch_id = ?
    `,
    [batchId]
  );
  const existingSet = new Set(existingRows.map((r) => r.recipe_id));

  const newItems = uniqueItems.filter((i) => !existingSet.has(i.recipe_id));
  console.log(">>> [refill] newItems(not in batch yet):", newItems.length);
  if (newItems.length === 0) return 0;

  // 5) recipe 테이블에 존재하는 것만 남기기 (FK 보호)
  const recipeIds = newItems.map((i)=> i.recipe_id);
  const [existingRecipes] = await conn.query(
    `
      SELECT recipe_id 
      FROM recipe 
      WHERE recipe_id IN (?)
    `,
    [recipeIds]
  );
  const validIdSet = new Set(existingRecipes.map((r) => r.recipe_id));

  const filteredItems = newItems.filter((i) => validIdSet.has(i.recipe_id));
  console.log(">>> [refill] filteredItems(FK OK):", filteredItems.length);
  if (filteredItems.length === 0) return 0;

  // 6) rank_no 이어붙이기
  const [[maxRankRow]] = await conn.query(
    `
      SELECT COALESCE(MAX(rank_no), 0) AS max_rank 
      FROM user_recommendation_item 
      WHERE batch_id = ?
    `,
    [batchId]
  );
  let currentRank = maxRankRow.max_rank;

  const values = filteredItems.map((item) => [
    batchId,
    item.recipe_id,
    ++currentRank,
  ]);

  await conn.query(
    `
      INSERT INTO user_recommendation_item 
      (batch_id, recipe_id, rank_no) 
      VALUES ?
    `,
    [values]
  );

  console.log(">>> [refill] inserted count:", values.length);
  return values.length;
}