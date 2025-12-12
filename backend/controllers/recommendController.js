import axios from "axios";
import db from '../db.js';
import defaults from "../config/recommendDefaults.js"; 
import { refillRecommendationsForBatch } from "../services/recommendRefillService.js";
import { syncUserToBatch } from '../services/recommendationService.js';

const AI_BASE_URL = process.env.AI_SERVICE_BASE_URL;

const safeJSONParse = (str, fallback = []) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    console.error("JSON Parse Warning:", e.message);
    return fallback;
  }
};

// [헬퍼] 데이터 변환 함수
const parseCookTime = (timeInput) => {
  if (!timeInput) return 0;
  if (typeof timeInput === 'number') return timeInput;

  const str = timeInput.toString();
  let totalMinutes = 0;

  const hourMatch = str.match(/(\d+)\s*(시간|h)/);
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;

  const minMatch = str.match(/(\d+)\s*(분|m)/);
  if (minMatch) totalMinutes += parseInt(minMatch[1]);

  if (!hourMatch && !minMatch) {
    const num = parseInt(str.replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return totalMinutes;
};

const parseDifficulty = (difficultyStr) => {
  if (!difficultyStr) return 2; 
  const level = difficultyStr.toString().toLowerCase();
  
  if (level.includes('초') || level.includes('easy') || level.includes('low')) return 1;
  if (level.includes('고') || level.includes('hard') || level.includes('high')) return 3;
  return 2;
};

// 1. 단일 추천 (Home 화면 - 랜덤/AI 추천 + 이미지 포함)
export const getSingleRecommendation = async (req, res) => {
  const conn = await db.getConnection();
  try {
    // DB에서 직접 조회하여 이미지 URL(img_url)을 포함한 데이터를 가져옵니다.
    const query = `
        SELECT 
            recipe_id,
            name AS recipe_name, 
            cooking_time, 
            difficulty,
            img_url  -- DB에 저장된 이미지 URL 컬럼
        FROM recipe
        ORDER BY RAND()   
        LIMIT 1;
    `;

    const [rows] = await conn.query(query);

    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "추천할 레시피가 없습니다." });
    }

    const recipe = rows[0];

    // 프론트엔드 요구사항(recipeImageUrl)에 맞춰 데이터 매핑
    return res.status(200).json({
        success: true,
        data: {
            id: recipe.recipe_id,
            name: recipe.recipe_name,
            time: parseCookTime(recipe.cooking_time),
            difficulty: parseDifficulty(recipe.difficulty), // 숫자(1,2,3)로 변환
            recipeImageUrl: recipe.img_url  // ✅ 프론트엔드가 원하는 변수명으로 매핑
        }
    });

  } catch (err) {
    console.error("단일 추천 로직 실패:", err.message);
    return res.status(500).json({ success: false, message: "서버 오류", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// 2. 주간 식단 추천 통합
export const getWeeklyRecommendation = async (req, res) => {
  const userObj = req.user;
  const user_id = userObj?.userId || userObj?.id || userObj?.user_id || (typeof userObj === 'object' ? null : userObj);

  console.log(`>>> [POST] /api/recommend/week 요청 (User ID: ${user_id})`);

  if (!AI_BASE_URL) return res.status(500).json({ message: "서버 설정 오류: AI URL 미설정" });
  if (!user_id) return res.status(401).json({ message: "유효하지 않은 사용자 토큰입니다." });

  const { cuisine, diet, days, meals_per_day, top_k } = req.body;
  const conn = await db.getConnection();

  try {
    await syncUserToBatch(conn, user_id);

    const [batchRows] = await conn.query(
      `SELECT id, diseases_json, allergies_json, fridge_ings_json 
       FROM user_recommendation_batch 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    if (batchRows.length === 0) throw new Error("배치 데이터 생성 실패");

    const batchData = batchRows[0];
    const batchId = batchData.id;
    const diseases = safeJSONParse(batchData.diseases_json);
    const allergies = safeJSONParse(batchData.allergies_json);
    const fridge_ings = safeJSONParse(batchData.fridge_ings_json);

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

    let aiRes;
    try {
        aiRes = await axios.post(`${AI_BASE_URL}/recommend/week`, aiPayload, { timeout: 20000 });
    } catch (axiosErr) {
        console.error("AI 통신 에러:", axiosErr.message);
        throw new Error("AI 서버 응답 실패");
    }

    const items = aiRes.data.items || [];

    await conn.beginTransaction();

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
        const values = filteredItems.map((item, idx) => [batchId, item.recipe_id, idx + 1]);
        await conn.query(`INSERT INTO user_recommendation_item (batch_id, recipe_id, rank_no) VALUES ?`, [values]);
      }
    }

    const [rawItems] = await conn.query(
      `
        SELECT
          uri.id AS recommendation_item_id,
          r.recipe_id,
          r.name,
          r.img_url,   -- ✅ SQL에서 이미 img_url을 가져오고 있음
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

    // [수정] recipeImageUrl 매핑 추가
    const processedItems = rawItems.map(item => ({
        ...item,
        cookTimeMinutes: parseCookTime(item.cooking_time),
        rating: parseDifficulty(item.difficulty),
        recipeImageUrl: item.img_url // ✅ 프론트엔드용 키 매핑
    }));

    const showIds = processedItems.map((row) => row.recommendation_item_id);
    if (showIds.length > 0) {
      await conn.query(`UPDATE user_recommendation_item SET is_shown = 1, shown_at = NOW() WHERE id IN (?)`, [showIds]);
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      batch_id: batchId,
      items: processedItems, 
    });

  } catch (err) {
    console.error("[Critical] /week 에러:", err.message);
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "서버 오류", error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

// 3. 리필 API
export const getNextWeeklyRecommendation = async (req, res) => {
  const { batch_id, selected_recipe_ids = [] } = req.body;
  if (!batch_id) return res.status(400).json({ message: "batch_id 필수" });

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
    
    const fetchItems = async (limit) => {
        return await conn.query(
            `
            SELECT
                uri.id AS recommendation_item_id,
                r.recipe_id,
                r.name,
                r.img_url,   -- ✅ SQL 확인
                r.difficulty,
                r.cooking_time
            FROM user_recommendation_item uri
            JOIN recipe r ON uri.recipe_id = r.recipe_id
            WHERE uri.batch_id    = ?
                AND uri.is_selected = 0
                AND uri.is_rejected = 0
                AND uri.is_shown    = 0
            ORDER BY uri.rank_no
            LIMIT ?
            `,
            [batch_id, limit]
        );
    };

    let [rawItems] = await fetchItems(NEED_COUNT);

    if (rawItems.length < NEED_COUNT) {
      await refillRecommendationsForBatch(conn, batch_id);
      const remain = NEED_COUNT - rawItems.length;
      if (remain > 0) {
        const [refilledItems] = await fetchItems(remain);
        rawItems = rawItems.concat(refilledItems);
      }
    }

    // [수정] recipeImageUrl 매핑 추가
    const processedItems = rawItems.map(item => ({
        ...item,
        cookTimeMinutes: parseCookTime(item.cooking_time),
        rating: parseDifficulty(item.difficulty),
        recipeImageUrl: item.img_url // ✅ 프론트엔드용 키 매핑
    }));

    const showIds = processedItems.map((row) => row.recommendation_item_id);
    if (showIds.length > 0) {
      await conn.query(`UPDATE user_recommendation_item SET is_shown = 1, shown_at = NOW() WHERE id IN (?)`, [showIds]);
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      batch_id,
      items: processedItems,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return res.status(500).json({ message: "리필 중 오류 발생" });
  } finally {
    if (conn) conn.release();
  }
};