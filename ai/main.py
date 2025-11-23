import os
from pathlib import Path
from typing import List, Optional, Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import tensorflow as tf
import numpy as np
import pickle

from utils.model_def import TwoTower, EMBED_DIM
from utils.data_utils import load_recipe_dataframe
from utils.rec_logic import RecContext, recommend_with_rules, build_weekly_plan

# 경로 설정
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR  = BASE_DIR / "data"

WEIGHTS_PATH      = MODEL_DIR / "two_tower_weights.weights.h5"
RECIPE_EMBS_PATH  = MODEL_DIR / "recipe_embs.npy"
RECIPE_VOCAB_PATH = MODEL_DIR / "recipe_vocab.pkl"
USER_VOCAB_PATH   = MODEL_DIR / "user_vocab.pkl"

DATA_CSV_PATH     = DATA_DIR / "bapple_all_recipes_cleaned.csv"

# 모델/데이터 로딩

print("Loading recipe dataframe...")
df, id_to_dfidx = load_recipe_dataframe(str(DATA_CSV_PATH))

print("Loading vocab & embeddings...")
with open(RECIPE_VOCAB_PATH, "rb") as f:
    recipe_vocab = pickle.load(f)

# user_vocab은 서버에서 직접 쓰진 않지만, 필요하다면 함께 로드 가능
with open(USER_VOCAB_PATH, "rb") as f:
    user_vocab = pickle.load(f)

recipe_embs = np.load(RECIPE_EMBS_PATH)

print("Loading model...")
# custom_objects에 TwoTower 등록
model = TwoTower(user_vocab=user_vocab, recipe_vocab=recipe_vocab, dim=EMBED_DIM)
model.built = True        # 안전용(없어도 돌아가지만 에러 방지)
model.load_weights(str(WEIGHTS_PATH))

# 추천 컨텍스트 생성
ctx = RecContext(
    model=model,
    recipe_embs=recipe_embs,
    recipe_vocab=recipe_vocab,
    df=df,
    id_to_dfidx=id_to_dfidx,
)

# FastAPI 앱 + CORS
app = FastAPI(
    title="Bapple Recipe Recommender",
    description="카테고리/질병/알레르기/냉장고 재료 기반 레시피 추천 API",
    version="1.0.0",
)

# 개발 단계에서는 전체 허용, 나중에 도메인 생기면 거기로 제한해도 됨
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청/응답 모델
class RecommendRequest(BaseModel):
    cuisine: str = "전체"             
    diet: str = "전체"                
    diseases: Optional[List[str]] = None 
    tags: Optional[List[str]] = None     
    allergies: Optional[List[str]] = None
    fridge_ings: Optional[List[str]] = None  
    top_k: int = 30

class RecommendItem(BaseModel):
    recipe_id: str
    ml_score: float
    fridge_bonus: float
    disease_bonus: float
    final_score: float

class RecommendResponse(BaseModel):
    results: List[RecommendItem]

class WeeklyPlanRequest(BaseModel):
    cuisine: str = "전체"
    diet: str = "전체"
    diseases: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    fridge_ings: Optional[List[str]] = None
    days: int = 7
    meals_per_day: int = 3
    top_k: int = 100

class WeeklyPlanItem(BaseModel):
    day: int
    meal: str     
    recipe_id: str
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    diet_type: Optional[str] = None
    tags: Optional[str] = None
    ml_score: float
    fridge_bonus: float
    disease_bonus: float
    final_score: float

class WeeklyPlanResponse(BaseModel):
    items: List[WeeklyPlanItem]

# 엔드포인트

# 헬스 체크용
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Bapple AI 추천 서버 동작 중"}

@app.post("/recommend", response_model=RecommendResponse)
def recommend_api(body: RecommendRequest):
    """
    조건 기반 단일 추천 리스트 반환 (레시피 ID + 점수들)
    """
    results_raw = recommend_with_rules(
        ctx=ctx,
        cuisine=body.cuisine,
        diet=body.diet,
        diseases=body.diseases,
        tags=body.tags,
        allergies=body.allergies,
        fridge_ings=body.fridge_ings,
        top_k=body.top_k,
    )

    items = [
        RecommendItem(
            recipe_id=r["recipe_id"],
            ml_score=r["ml_score"],
            fridge_bonus=r["fridge_bonus"],
            disease_bonus=r["disease_bonus"],
            final_score=r["final_score"],
        )
        for r in results_raw
    ]
    return RecommendResponse(results=items)

@app.post("/recommend/week", response_model=WeeklyPlanResponse)
def recommend_week_api(body: WeeklyPlanRequest):
    """
    1주일 식단(일자/끼니별 레시피) 추천
    """
    weekly_df = build_weekly_plan(
        ctx=ctx,
        cuisine=body.cuisine,
        diet=body.diet,
        diseases=body.diseases,
        tags=body.tags,
        allergies=body.allergies,
        fridge_ings=body.fridge_ings,
        days=body.days,
        meals_per_day=body.meals_per_day,
        top_k=body.top_k,
    )

    items: List[WeeklyPlanItem] = []
    for _, row in weekly_df.iterrows():
        items.append(
            WeeklyPlanItem(
                day=int(row["day"]),
                meal=str(row["meal"]),
                recipe_id=str(row["recipe_id"]),
                name=row.get("name"),
                cuisine_type=row.get("cuisine_type"),
                diet_type=row.get("diet_type"),
                tags=row.get("tags"),
                ml_score=float(row["ml_score"]),
                fridge_bonus=float(row["fridge_bonus"]),
                disease_bonus=float(row["disease_bonus"]),
                final_score=float(row["final_score"]),
            )
        )

    return WeeklyPlanResponse(items=items)

# 로컬/Railway 실행 엔트리포인트
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))  # Railway에서 PORT 환경변수로 포트 지정
    uvicorn.run("main:app", host="0.0.0.0", port=port)