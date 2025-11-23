from dataclasses import dataclass
from typing import List, Optional, Dict, Any

import numpy as np
import pandas as pd
import tensorflow as tf

# 19대 알레르기(사용자 선택용)
ALLERGEN_CHOICES = [
    "알류", "우유", "메밀", "땅콩", "대두", "밀",
    "잣", "호두", "게", "새우", "오징어", "고등어",
    "조개류", "복숭아", "토마토",
    "닭고기", "돼지고기", "쇠고기", "아황산류",
]

def clean_allergy_input(allergies: Optional[List[str]]) -> List[str]:
    if not allergies:
        return []
    return [a for a in allergies if a in ALLERGEN_CHOICES]

@dataclass
class RecContext:
    model: tf.keras.Model
    recipe_embs: np.ndarray
    recipe_vocab: List[str]
    df: pd.DataFrame
    id_to_dfidx: Dict[str, int]

# 토큰 생성
def build_tokens(
    cuisine: str = "전체",
    diet: str = "전체",
    diseases: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
) -> List[str]:
    diseases = diseases or []
    tags = tags or []

    tokens: List[str] = []
    if cuisine != "전체":
        tokens.append(f"cuisine::{cuisine}")
    if diet != "전체":
        tokens.append(f"diet::{diet}")
    for d in diseases:
        tokens.append(f"disease::{d}")
    for t in tags:
        tokens.append(f"tag::{t}")

    if not tokens:
        tokens = ["global::default"]
    return tokens

# 알레르기 필터
def filter_allergies_df(df: pd.DataFrame, allergies: List[str]) -> pd.DataFrame:
    if not allergies:
        return df

    allergies = [a.strip() for a in allergies if a.strip()]

    def has_allergy(row) -> bool:
        ings = row["ingredient_list"]
        for al in allergies:
            for ing in ings:
                if al in ing:  # 부분 매칭
                    return True
        return False

    return df[~df.apply(has_allergy, axis=1)]

#  가점 계산
def calc_fridge_bonus(ctx: RecContext, recipe_id: str, fridge_ings: List[str]) -> float:
    if not fridge_ings:
        return 0.0
    idx = ctx.id_to_dfidx.get(recipe_id)
    if idx is None:
        return 0.0

    recipe_ings = set(ctx.df.iloc[idx]["ingredient_list"])
    if not recipe_ings:
        return 0.0

    fridge_set = set(fridge_ings)
    inter = recipe_ings & fridge_set
    if not recipe_ings:
        return 0.0
    return len(inter) / len(recipe_ings)

def calc_disease_bonus(ctx: RecContext, recipe_id: str, diseases: List[str]) -> float:
    if not diseases:
        return 0.0
    idx = ctx.id_to_dfidx.get(recipe_id)
    if idx is None:
        return 0.0

    tags = set(ctx.df.iloc[idx]["tag_list"])
    score = 0.0
    for d in diseases:
        ok_tag   = f"{d}_적합"
        warn_tag = f"{d}_주의"
        if ok_tag in tags:
            score += 1.0
        if warn_tag in tags:
            score -= 1.0
    return score

# 기본 recommend
def recommend(
    ctx: RecContext,
    cuisine: str = "전체",
    diet: str = "전체",
    diseases: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    allergies: Optional[List[str]] = None,
    top_k: int = 30,
):
    diseases  = diseases or []
    tags      = tags or []
    allergies = clean_allergy_input(allergies or [])

    df = ctx.df
    recipe_vocab = ctx.recipe_vocab
    recipe_embs = ctx.recipe_embs
    model = ctx.model

    # 1) cuisine & diet 교집합
    sub = df.copy()
    if cuisine != "전체":
        sub = sub[sub["cuisine_type"] == cuisine]
    if diet != "전체":
        sub = sub[sub["diet_type"] == diet]

    # 2) 알레르기 제거
    sub = filter_allergies_df(sub, allergies)
    candidate_ids = sub["recipe_id"].tolist()

    # 3) 교집합이 없으면 카테고리 전체 + 다이어트 전체 합집합
    if len(candidate_ids) == 0 and (cuisine != "전체" and diet != "전체"):
        sub_cuisine = df[df["cuisine_type"] == cuisine]
        sub_diet    = df[df["diet_type"] == diet]

        sub_cuisine = filter_allergies_df(sub_cuisine, allergies)
        sub_diet    = filter_allergies_df(sub_diet, allergies)

        candidate_ids = list(
            set(sub_cuisine["recipe_id"].tolist()) |
            set(sub_diet["recipe_id"].tolist())
        )

    # 4) 그래도 없으면 전체에서 알레르기만 빼고 사용
    if len(candidate_ids) == 0:
        sub_all = filter_allergies_df(df.copy(), allergies)
        candidate_ids = sub_all["recipe_id"].tolist()
        if len(candidate_ids) == 0:
            return [], []

        id_to_index = {rid: i for i, rid in enumerate(recipe_vocab)}
        cand_indices = [id_to_index[rid] for rid in candidate_ids if rid in id_to_index]
        cand_embs = tf.gather(recipe_embs, cand_indices)
    else:
        id_to_index = {rid: i for i, rid in enumerate(recipe_vocab)}
        pairs = [(rid, id_to_index[rid]) for rid in candidate_ids if rid in id_to_index]

        if not pairs:
            sub_all = filter_allergies_df(df.copy(), allergies)
            candidate_ids = sub_all["recipe_id"].tolist()
            id_to_index = {rid: i for i, rid in enumerate(recipe_vocab)}
            cand_indices = [id_to_index[rid] for rid in candidate_ids if rid in id_to_index]
            cand_embs = tf.gather(recipe_embs, cand_indices)
        else:
            candidate_ids = [p[0] for p in pairs]
            cand_indices  = [p[1] for p in pairs]
            cand_embs = tf.gather(recipe_embs, cand_indices)

    # 5) user embedding
    tokens = build_tokens(cuisine, diet, diseases, tags)
    token_tensor = tf.constant(tokens)

    t_vecs = model.user_emb(model.user_lookup(token_tensor))
    t_vecs = tf.math.l2_normalize(t_vecs, axis=1)
    user_vec = tf.reduce_mean(t_vecs, axis=0, keepdims=True)
    user_vec = tf.math.l2_normalize(user_vec, axis=1)

    # 6) 점수 계산
    scores = tf.linalg.matvec(cand_embs, tf.squeeze(user_vec))
    k = min(top_k, scores.shape[0])

    topk = tf.math.top_k(scores, k=k)
    top_ids    = [candidate_ids[i] for i in topk.indices.numpy()]
    top_scores = topk.values.numpy()

    return top_ids, top_scores

# 가점 포함 최종 추천
def recommend_with_rules(
    ctx: RecContext,
    cuisine: str = "전체",
    diet: str = "전체",
    diseases: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    allergies: Optional[List[str]] = None,
    fridge_ings: Optional[List[str]] = None,
    top_k: int = 50,
    w_ml: float = 1.0,
    w_fridge: float = 0.5,
    w_disease: float = 0.7,
) -> List[Dict[str, Any]]:
    diseases    = diseases or []
    tags        = tags or []
    allergies   = clean_allergy_input(allergies or [])
    fridge_ings = fridge_ings or []

    base_ids, base_scores = recommend(
        ctx=ctx,
        cuisine=cuisine,
        diet=diet,
        diseases=diseases,
        tags=tags,
        allergies=allergies,
        top_k=top_k,
    )

    results: List[Dict[str, Any]] = []
    for rid, ml_score in zip(base_ids, base_scores):
        fb = calc_fridge_bonus(ctx, rid, fridge_ings)
        db = calc_disease_bonus(ctx, rid, diseases)

        final_score = (
            w_ml * float(ml_score)
            + w_fridge * float(fb)
            + w_disease * float(db)
        )

        results.append({
            "recipe_id": rid,
            "ml_score": float(ml_score),
            "fridge_bonus": float(fb),
            "disease_bonus": float(db),
            "final_score": float(final_score),
        })

    results = sorted(results, key=lambda x: x["final_score"], reverse=True)
    return results

# 1주일 식단 편성
def build_weekly_plan(
    ctx: RecContext,
    cuisine: str = "전체",
    diet: str = "전체",
    diseases: Optional[List[str]] = None,
    tags: Optional[List[str]] = None,
    allergies: Optional[List[str]] = None,
    fridge_ings: Optional[List[str]] = None,
    days: int = 7,
    meals_per_day: int = 3,
    top_k: int = 100,
) -> pd.DataFrame:
    diseases    = diseases or []
    tags        = tags or []
    allergies   = clean_allergy_input(allergies or [])
    fridge_ings = fridge_ings or []

    total_needed = days * meals_per_day

    ranked = recommend_with_rules(
        ctx=ctx,
        cuisine=cuisine,
        diet=diet,
        diseases=diseases,
        tags=tags,
        allergies=allergies,
        fridge_ings=fridge_ings,
        top_k=top_k,
    )

    ranked = ranked[:total_needed]

    meal_names = ["아침", "점심", "저녁"]
    rows: List[Dict[str, Any]] = []

    for day in range(days):
        for m in range(meals_per_day):
            idx = day * meals_per_day + m
            if idx >= len(ranked):
                break

            item = ranked[idx]
            rid = item["recipe_id"]
            df_idx = ctx.id_to_dfidx.get(rid)
            if df_idx is None:
                continue
            row = ctx.df.iloc[df_idx]

            rows.append({
                "day": day + 1,
                "meal": meal_names[m],
                "recipe_id": rid,
                "name": row["name"],
                "cuisine_type": row.get("cuisine_type"),
                "diet_type": row.get("diet_type"),
                "tags": row.get("tags"),
                "ml_score": item["ml_score"],
                "fridge_bonus": item["fridge_bonus"],
                "disease_bonus": item["disease_bonus"],
                "final_score": item["final_score"],
            })

    return pd.DataFrame(rows)