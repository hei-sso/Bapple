import express from "express";
import axios from "axios";
import db from '../db.js';
import defaults from "../config/recommendDefaults.js";

const router = express.Router();
const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL; 

// 1) 단일 추천 리스트 (오늘 먹을 레시피 추천)
// POST /api/recommend
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // FastAPI로 그대로 전달
    const response = await axios.post(`${AI_BASE_URL}/recommend`, body, {
      headers: { "Content-Type": "application/json" }
    });

    return res.json({
      success: true,
      data: response.data,
    });

    } catch (err) {
    console.error("FastAPI /recommend 호출 실패:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "AI 추천 서버 호출 실패",
      error: err.response?.data || err.message,
    });
  }
});

// 2) 주간 식단 추천 (7일 × N끼니)
// POST /api/recommend/week
router.post("/week", async (req, res) => {
  try {
    const body = req.body;

    // FastAPI로 전달
    const response = await axios.post(`${AI_BASE_URL}/recommend/week`, body, {
      headers: { "Content-Type": "application/json" }
    });

    return res.json({
      success: true,
      data: response.data,
    });

  } catch (err) {
    console.error("FastAPI /recommend/week 호출 실패:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "AI 주간추천 서버 호출 실패",
      error: err.response?.data || err.message,
    });
  }
});

// ===========/week/start 라우터 전체 코드=====
router.post("/week/start", async (req, res) => {
  console.log(">>> [POST] /api/recommend/week/start hit"); 
  const{
    user_id,
    cuisine,
    diet,
    diseases = [],
    tags = [],
    allergies = [],
    fridge_ings = [],
    days,
    meals_per_day,
    top_k,
  } = req.body;

  if(!user_id){
    return res.status(400).json({message: "user_id는 필수입니다."});
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1) 같은 user의 이전 batch 삭제 (item은 ON DELETE CASCADE 로 같이 삭제)
    await conn.query(
      `DELETE FROM user_recommendation_batch WHERE user_id = ?`, [user_id]
    );

    // 2) 새 batch 생성 (DB에는 최소 정보만 저장)
    const [batchResult] = await conn.query(
      `
        INSERT INTO user_recommendation_batch 
        (user_id, diseases_json, allergies_json, fridge_ings_json) 
        VALUES (?, ?, ?, ?)
      `,
      [
        user_id,
        JSON.stringify(diseases),
        JSON.stringify(allergies),
        JSON.stringify(fridge_ings),
      ]
    );

    const batchId = batchResult.insertId;

    // 3) AI 서버에 보낼 payload 만들기
    const aiPayload = {
      cuisine: cuisine ?? defaults.cuisine,
      diet: diet ?? defaults.diet,
      diseases,
      tags: tags ?? defaults.tags,
      allergies,
      fridge_ings,
      days: days ?? defaults.days,
      meals_per_day: meals_per_day ?? defaults.meals_per_day,
      top_k: top_k ?? defaults.top_k,
    };

    // 디버깅용 로그
    console.log("AI /recommend/week payload:", aiPayload);

    // 4) AI 서버 호출
    const aiRes = await axios.post(
      `${AI_BASE_URL}/recommend/week`, aiPayload,
      {timeout: 20000}
    );

    const items = aiRes.data.items || []; // 기대형태: [{ recipe_id: "..." }, ...]

    // 5) 추천 결과를 user_recommendation_item 에 저장
    if (items.length > 0) {
      const values = items.map((item, idx) => [
        batchId,
        item.recipe_id,
        idx + 1, // rank_no: 1부터 시작
      ]);

      await conn.query(
        `
          INSERT INTO user_recommendation_item
          (batch_id, recipe_id, rank_no)
          VALUES ?
        `,
        [values]
      );
    }

    // 6) 첫 10개를 recipe 테이블과 조인해서 가져오기
    const [first10] = await conn.query(
      `
        SELECT
          uri.id AS recommendation_item_id,
          r.recipe_id,
          r.name,
          r.difficulty,
          r.cooking_time
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

    // 7) 이 10개는 화면에 보여줄 거니까 is_shown = 1 로 업데이트
    const showIds = first10.map((row) => row.recommendation_item_id);

    if(showIds.length > 0){
      await conn.query(
        `
        UPDATE user_recommendation_item
        SET is_shown = 1, shown_at = NOW()
        WHERE id IN (?)
        `,
        [showIds]
      );
    }

    await conn.commit();

    // 8) UI로 batch_id + 10개 추천 레시피 반환
    return res.status(201).json({
      batch_id: batchId,
      items: first10,
    });
  } catch (err) {
    console.error("/week/start error:", err);
    await conn.rollback();
    return res.status(500).json({ message: "추천 생성 중 오류가 발생했습니다." });
  } finally {
    conn.release();
  }
});

// ======week/next 선택 7개/나머지 3개 처리 + 다음 10개 조회
router.post("/week/next", async (req, res)=>{
  const { batch_id, selected_recipe_id = []} = req.body;

  if(!batch_id){
    return res.status(400).json({message: "batch_id는 필수입니다."});
  }
  
  const conn = await db.getConnection();

  try{
    await conn.beginTransaction();

    // 1) 선택된 레시피들 선택 처리
    if(selected_recipe_id.length > 0){
      await conn.query(
        `
        UPDATE user_recommendation_item 
        SET is_selected = 1, selected_at = NOW() 
        WHERE batch_id = ? 
          AND recipe_id IN (?)
        `,
        [batch_id, selected_recipe_id]
      );
    }
    // 2) 이번에 화면에 보였는데 선택되지 않은 나머지는 거절 처리
    await conn.query(
      `
      UPDATE user_recommendation_item 
      SET is_rejected = 1, rejected_at = NOW() 
      WHERE batch_id = ? 
        AND is_shown = 1
        AND is_selected = 0
        AND is_rejected = 0
      `,
      [batch_id]
    );
    // 3) 아직 한번도 안 보여준 후보들 중에서 10뽑기
    let [next10] = await conn.query(
      `
      SELECT 
        uri.id AS recommendation_item_id,
        r.recipe_id,
        r.name,
        r.difficulty,
        r.cooking_time 
      FROM user_recommendation_item uri 
      JOIN recipe r ON uri.recipe_id = r.recipe_id 
      WHERE uri.batch_id = ? 
        AND uri.is_selected = 0 
        AND uri.is_rejected = 0 
        AND uri.is_shown = 0 
      ORDER BY uri.rank_no
      LIMIT 10
      `,
      [batch_id]
    );

    console.log(">>> /week/start aiPayload:", aiPayload);
    console.log(">>> AI returned items length:", items.length);
    console.log(">>> insert values count:", values.length);

    // (선택) 만약 남은 후보가 10개 미만이면, 지금은 그냥 있는 만큼만 반환.
    // 나중에 "50개 다 떨어지면 AI 다시 호출해서 채우기" 로직을 여기에 추가하면 됨.

    // 4) 이번에 내려줄 후보들 is_shown = 1 업데이트
    const showIds = next10.map((row) => row.recommendation_item_id);
    if(showIds.length > 0){
      await conn.query(
        `
        UPDATE user_recommendation_item 
        SET is_shown = 1, shown_at = NOW() 
        WHERE id IN (?)
        `,
        [showIds]
      );
    }
    await conn.commit();

    return res.status(200).json({
      batch_id,
      items: next10,
    });
  }catch (err){
    console.error("/week/next error:", err);
    await conn.rollback();
    return res.status(500).json({message: "다음 추천 생성 중 오류가 발생했습니다."});
  }finally{
    conn.release();
  }
});

export default router;