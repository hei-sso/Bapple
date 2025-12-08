import axios from "axios";
import db from '../db.js';
import defaults from "../config/recommendDefaults.js"; 
import { refillRecommendationsForBatch } from "../services/recommendRefillService.js";
import { syncUserToBatch } from '../services/recommendationService.js';

// 환경변수 로드
const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL;

// [헬퍼] JSON 파싱 안전 함수
const safeJSONParse = (str, fallback = []) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    console.error("JSON Parse Warning:", e.message);
    return fallback;
  }
};

// 주간 식단 추천 통합 (동기화 -> 생성 -> 저장 -> 조회)
export const getWeeklyRecommendation = async (req, res) => {
  
  // 1. 유저 식별
  // console.log("### [Debug] req.user 확인:", req.user);
  const user_id = req.user?.userId || req.user?.id || req.user;

  console.log(`>>> [POST] /api/recommend/week 요청 시작 (User ID: ${user_id})`);

  if (!AI_BASE_URL) {
    console.error("Critical Error: .env 파일에 AI_SERVICE_BASE_URL이 없습니다.");
    return res.status(500).json({ message: "서버 설정 오류: AI URL 미설정" });
  }
  
  if (!user_id) {
    return res.status(401).json({ message: "유효하지 않은 사용자 토큰입니다." });
  }

  // [스코프 해결] req.body에서 값 추출 (값이 없으면 undefined -> 아래에서 defaults 적용됨)
  const { 
    cuisine, diet, days, meals_per_day, top_k 
  } = req.body;

  const conn = await db.getConnection();

  try {
    // 2. 최신 데이터 동기화 (냉장고/건강 -> Batch 테이블)
    console.log("--- 1. 데이터 동기화 (syncUserToBatch) ---");
    await syncUserToBatch(user_id);

    // 3. 배치 데이터 조회
    const [batchRows] = await conn.query(
      `SELECT id, diseases_json, allergies_json, fridge_ings_json 
       FROM user_recommendation_batch 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    if (batchRows.length === 0) {
      throw new Error("배치 데이터 생성 실패 (동기화 로직 확인 필요)");
    }

    const batchData = batchRows[0];
    const batchId = batchData.id;

    // JSON 파싱
    const diseases = safeJSONParse(batchData.diseases_json);
    const allergies = safeJSONParse(batchData.allergies_json);
    const fridge_ings = safeJSONParse(batchData.fridge_ings_json);

    console.log(`[DEBUG] Batch ID: ${batchId}`);

    // 4. AI 요청 Payload 구성 (값이 없으면 defaults 사용)
    const aiPayload = {
      cuisine: cuisine ?? defaults.cuisine,
      diet: diet ?? defaults.diet,
      diseases: diseases,
      tags: defaults.tags,
      allergies: allergies,
      fridge_ings: fridge_ings,
      days: days ?? defaults.days,
      meals_per_day: meals_per_day ?? defaults.meals_per_day,
      top_k: top_k ?? defaults.top_k,
    };

    // 5. AI 서버 호출
    // [수정] AI_SERVICE_BASE_URL -> AI_BASE_URL 변수 사용
    console.log(`--- 2. AI 서버 호출 (${AI_BASE_URL}/api/recommend/week) ---`);
    let aiRes;
    try {
        aiRes = await axios.post(
            `${AI_BASE_URL}/api/recommend/week`, 
            aiPayload,
            { timeout: 20000 } // 20초 타임아웃
        );
    } catch (axiosErr) {
        console.error("AI 서버 통신 에러:", axiosErr.message);
        if (axiosErr.code === 'ECONNABORTED') {
             throw new Error("AI 서버 응답 시간 초과");
        }
        throw new Error("AI 서버 오류: 응답 없음");
    }

    const items = aiRes.data.items || [];
    console.log(`AI 응답 완료. 수신된 레시피 수: ${items.length}`);

    // 여기서부터 [저장 후 조회] 로직 시작 (Transaction)
    await conn.beginTransaction();

    // 6. 중복 제거
    const seen = new Set();
    const uniqueItems = [];
    for (const item of items) {
      if (!item.recipe_id) continue;
      if (seen.has(item.recipe_id)) continue;
      seen.add(item.recipe_id);
      uniqueItems.push(item);
    }

    if (uniqueItems.length > 0) {
      const recipeIds = uniqueItems.map((i) => i.recipe_id);
      
      // 실제 존재하는 레시피인지 확인 (Foreign Key 에러 방지)
      const [existingRecipes] = await conn.query(
        `SELECT recipe_id FROM recipe WHERE recipe_id IN (?)`,
        [recipeIds]
      );
      const validIdSet = new Set(existingRecipes.map((r) => r.recipe_id));
      const filteredItems = uniqueItems.filter((i) => validIdSet.has(i.recipe_id));

      if (filteredItems.length > 0) {
        // [INSERT] DB에 AI 결과 저장
        const values = filteredItems.map((item, idx) => [
          batchId,
          item.recipe_id,
          idx + 1, // 순위
        ]);

        await conn.query(
          `INSERT INTO user_recommendation_item (batch_id, recipe_id, rank_no) VALUES ?`,
          [values]
        );
        console.log(`   -> DB 저장 완료: ${filteredItems.length}건`);
      }
    }

    // 7. 결과 조회 (방금 저장한 것 중 상위 10개)
    const [first10] = await conn.query(
      `
        SELECT
          uri.id AS recommendation_item_id,
          r.recipe_id,
          r.name,
          r.difficulty,
          r.cooking_time,
          r.img_url
        FROM user_recommendation_item uri
        JOIN recipe r ON uri.recipe_id = r.recipe_id
        WHERE uri.batch_id    = ?
          AND uri.is_selected = 0
          AND uri.is_rejected = 0
          AND uri.is_shown    = 0
        ORDER BY uri.rank_no
        LIMIT 10
      `,
      [batchId]
    );

    // 8. 보여짐(is_shown) 처리
    const showIds = first10.map((row) => row.recommendation_item_id);
    if (showIds.length > 0) {
      await conn.query(
        `UPDATE user_recommendation_item SET is_shown = 1, shown_at = NOW() WHERE id IN (?)`,
        [showIds]
      );
    }

    await conn.commit();

    // 9. 최종 응답
    console.log("추천 로직 정상 종료. 클라이언트로 데이터 전송.");
    return res.status(201).json({
      success: true,
      batch_id: batchId,
      items: first10, 
    });

  } catch (err) {
    console.error("[Critical] /week 처리 중 예외 발생:", err);
    if (conn) await conn.rollback();
    return res.status(500).json({ 
        message: "추천 생성 중 서버 오류가 발생했습니다.", 
        error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
};