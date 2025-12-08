import express from "express";
import axios from "axios";
import db from '../db.js';
import defaults from "../config/recommendDefaults.js";
import { refillRecommendationsForBatch } from "../services/recommendRefillService.js";
import { syncUserToBatch } from '../services/recommendationService.js';

const router = express.Router();
const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL; 

// 1) 단일 추천 리스트 (오늘 먹을 레시피 추천)
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const response = await axios.post(`${AI_BASE_URL}/recommend`, body, {
      headers: { "Content-Type": "application/json" }
    });
    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("FastAPI /recommend 호출 실패:", err.response?.data || err.message);
    return res.status(500).json({ success: false, message: "AI 추천 서버 호출 실패", error: err.message });
  }
});

// 2) 주간 식단 추천 (7일 × N끼니)
router.post("/week", async (req, res) => {
  try {
    const body = req.body;
    const response = await axios.post(`${AI_BASE_URL}/recommend/week`, body, {
      headers: { "Content-Type": "application/json" }
    });
    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("FastAPI /recommend/week 호출 실패:", err.response?.data || err.message);
    return res.status(500).json({ success: false, message: "AI 주간추천 서버 호출 실패", error: err.message });
  }
});

// /week/start 라우터
router.post("/week/start", async (req, res) => {
  console.log(">>> [POST] /api/recommend/week/start 요청 받음"); 
  const { user_id, cuisine, diet, days, meals_per_day, top_k } = req.body;

  if(!user_id){
    return res.status(400).json({message: "user_id는 필수입니다."});
  }

  const conn = await db.getConnection();

  try {
    // 1. 최신 데이터 동기화
    await syncUserToBatch(user_id); 

    // 2. 배치 데이터 조회
    const [batchRows] = await conn.query(
      `SELECT id, diseases_json, allergies_json, fridge_ings_json 
       FROM user_recommendation_batch 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 1`, 
      [user_id]
    );

    if (batchRows.length === 0) {
      throw new Error("배치 데이터 생성 실패 (동기화 오류)");
    }

    const batchData = batchRows[0];
    const batchId = batchData.id;

    // 데이터 파싱
    const diseases = batchData.diseases_json ? JSON.parse(batchData.diseases_json) : [];
    const allergies = batchData.allergies_json ? JSON.parse(batchData.allergies_json) : [];
    const fridge_ings = batchData.fridge_ings_json ? JSON.parse(batchData.fridge_ings_json) : [];

    console.log(`[DEBUG] New Batch ID: ${batchId}`);
    console.log(`[DEBUG] AI로 보낼 최신 재료 목록:`, fridge_ings);

    // 3. AI 요청 Payload
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

    console.log("AI 호출 Payload:", JSON.stringify(aiPayload, null, 2));

    // 4. AI 서버 호출
    const aiRes = await axios.post(
      `${AI_BASE_URL}/recommend/week`, aiPayload,
      { timeout: 20000 }
    );

    const items = aiRes.data.items || []; 
    console.log(`[DEBUG] AI 추천 결과 ${items.length}개 수신`);

    await conn.beginTransaction();

    // 중복 제거
    const seen = new Set();
    const uniqueItems = [];
    for(const item of items){
      if (!item.recipe_id) continue; 
      if(seen.has(item.recipe_id)) continue; 
      seen.add(item.recipe_id);
      uniqueItems.push(item);
    }

    // DB 검증 및 저장
    if(uniqueItems.length > 0){
      const recipeIds = uniqueItems.map((i)=> i.recipe_id);
      const [existingRecipes] = await conn.query(
        `SELECT recipe_id FROM recipe WHERE recipe_id IN (?)`,
        [recipeIds]
      );
      const validIdSet = new Set(existingRecipes.map((r)=> r.recipe_id));
      const filteredItems = uniqueItems.filter((i)=> validIdSet.has(i.recipe_id));

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
        console.log(`[DEBUG] 추천 아이템 ${values.length}개 저장 완료`);
      }
    }

    // 결과 조회
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
        WHERE uri.batch_id = ?
          AND uri.is_selected = 0
          AND uri.is_rejected = 0
          AND uri.is_shown = 0
        ORDER BY uri.rank_no
        LIMIT 10
      `,
      [batchId]
    );

    // 보여줌 처리
    const showIds = first10.map((row) => row.recommendation_item_id);
    if(showIds.length > 0){
      await conn.query(
        `UPDATE user_recommendation_item SET is_shown = 1, shown_at = NOW() WHERE id IN (?)`,
        [showIds]
      );
    }
    
    await conn.commit();

    return res.status(201).json({
      success: true,
      batch_id: batchId,
      items: first10,
    });

  } catch (err) {
    console.error("/week/start error:", err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "추천 생성 실패", error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// week/next
router.post("/week/next", async (req, res) => {
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
        WHERE uri.batch_id = ?
          AND uri.is_selected = 0
          AND uri.is_rejected = 0
          AND uri.is_shown = 0
        ORDER BY uri.rank_no
        LIMIT ?
      `,
      [batch_id, NEED_COUNT]
    );

    if (next10.length < NEED_COUNT) {
      console.log(`>>> batch ${batch_id}: 리필 시도...`);
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
            WHERE uri.batch_id = ?
              AND uri.is_selected = 0
              AND uri.is_rejected = 0
              AND uri.is_shown = 0
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
    console.error("/week/next error:", err);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "다음 추천 오류" });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
