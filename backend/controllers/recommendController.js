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

// ==========================================
// 1. 단일 추천 리스트 (POST /api/recommend)
// ==========================================
export const getSingleRecommendation = async (req, res) => {
  try {
    if (!AI_BASE_URL) throw new Error("AI_SERVICE_BASE_URL 환경변수가 설정되지 않았습니다.");

    const body = req.body;
    console.log(">>> [POST] /recommend (Single) 요청");

    const response = await axios.post(`${AI_BASE_URL}/recommend`, body, {
      headers: { "Content-Type": "application/json" }
    });
    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("AI /recommend 호출 실패:");
    if (err.response) {
      console.error("   Status:", err.response.status);
      console.error("   Data:", err.response.data);
    } else {
      console.error("   Error:", err.message);
    }
    return res.status(500).json({ success: false, message: "AI 추천 서버 호출 실패", error: err.message });
  }
};

// ==========================================
// 2. 주간 식단 추천 통합 (POST /api/recommend/week)
// ==========================================
export const getWeeklyRecommendation = async (req, res) => {
  
  // 1. 유저 식별
  const user_id = req.user?.userId || req.user?.id || req.user;
  console.log(`>>> [POST] /api/recommend/week 요청 시작 (User ID: ${user_id})`);

  if (!AI_BASE_URL) {
    console.error("Critical Error: .env 파일에 AI_SERVICE_BASE_URL이 없습니다.");
    return res.status(500).json({ message: "서버 설정 오류: AI URL 미설정" });
  }
  
  if (!user_id) {
    return res.status(401).json({ message: "유효하지 않은 사용자 토큰입니다." });
  }

  // [스코프 해결] req.body에서 값 추출
  const { 
    cuisine, diet, days, meals_per_day, top_k 
  } = req.body;

  const conn = await db.getConnection();

  try {
    // 2. 최신 데이터 동기화
    console.log("--- 1. 데이터 동기화 (syncUserToBatch) ---");
    await syncUserToBatch(conn, user_id);

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

    // 4. AI 요청 Payload 구성
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
    console.log(`--- 2. AI 서버 호출 (${AI_BASE_URL}/api/recommend/week) ---`);
    let aiRes;
    try {
        aiRes = await axios.post(
            `${AI_BASE_URL}/api/recommend/week`,
            aiPayload,
            { timeout: 20000 }
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

    // --- 저장 후 조회 로직 시작 ---
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
      
      const [existingRecipes] = await conn.query(
        `SELECT recipe_id FROM recipe WHERE recipe_id IN (?)`,
        [recipeIds]
      );
      const validIdSet = new Set(existingRecipes.map((r) => r.recipe_id));
      const filteredItems = uniqueItems.filter((i) => validIdSet.has(i.recipe_id));

      if (filteredItems.length > 0) {
        const values = filteredItems.map((item, idx) => [
          batchId,
          item.recipe_id,
          idx + 1,
        ]);

        await conn.query(
          `INSERT INTO user_recommendation_item (batch_id, recipe_id, rank_no) VALUES ?`,
          [values]
        );
        console.log(`   -> DB 저장 완료: ${filteredItems.length}건`);
      }
    }

    // 7. 결과 조회
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

    // 8. 보여짐 처리
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

// ==========================================
// 3. 다음 추천 리필 (POST /api/recommend/week/next)
// ==========================================
export const getNextWeeklyRecommendation = async (req, res) => {
  const { batch_id, selected_recipe_ids = [] } = req.body;

  if (!batch_id) {
    return res.status(400).json({ message: "batch_id는 필수입니다." });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    if (selected_recipe_ids.length > 0) {
      await conn.query(
        `UPDATE user_recommendation_item SET is_selected = 1, selected_at = NOW() WHERE batch_id = ? AND recipe_id IN (?)`,
        [batch_id, selected_recipe_ids]
      );
    }

    await conn.query(
      `UPDATE user_recommendation_item SET is_rejected = 1, rejected_at = NOW() WHERE batch_id = ? AND is_shown = 1 AND is_selected = 0 AND is_rejected = 0`,
      [batch_id]
    );

    const NEED_COUNT = 10;

    let [next10] = await conn.query(
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
        LIMIT ?
      `,
      [batch_id, NEED_COUNT]
    );

    if (next10.length < NEED_COUNT) {
      console.log(`>>> batch ${batch_id}: 리필(Refill) 시도...`);
      await refillRecommendationsForBatch(conn, batch_id);

      const remain = NEED_COUNT - next10.length;
      if (remain > 0) {
        const [refilled] = await conn.query(
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
            LIMIT ?
          `,
          [batch_id, remain]
        );
        next10 = next10.concat(refilled);
      }
    }

    const showIds = next10.map((row) => row.recommendation_item_id);
    if (showIds.length > 0) {
      await conn.query(
        `UPDATE user_recommendation_item SET is_shown = 1, shown_at = NOW() WHERE id IN (?)`,
        [showIds]
      );
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      batch_id,
      items: next10,
    });
  } catch (err) {
    console.error("/week/next 처리 중 오류:", err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "다음 추천 생성 중 오류가 발생했습니다." });
  } finally {
    if (conn) conn.release();
  }
};
