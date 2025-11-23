import tensorflow as tf
import pickle
import numpy as np
from pathlib import Path

from utils.model_def import TwoTower, EMBED_DIM

# === 경로 설정 ===
BASE_DIR = Path(".")   # 현재 경로 기준 (Colab이면 "/content")
MODEL_DIR = BASE_DIR / "models"

RECIPE_EMBS_PATH  = MODEL_DIR / "recipe_embs.npy"
RECIPE_VOCAB_PATH = MODEL_DIR / "recipe_vocab.pkl"
USER_VOCAB_PATH   = MODEL_DIR / "user_vocab.pkl"
ORIGINAL_WEIGHTS  = MODEL_DIR / "two_tower_weights.weights.h5"

PURE_WEIGHTS = MODEL_DIR / "pure_two_tower_weights.weights.h5"


# === vocab 로드 ===
print("Loading vocab files...")

with open(RECIPE_VOCAB_PATH, "rb") as f:
    recipe_vocab = pickle.load(f)

with open(USER_VOCAB_PATH, "rb") as f:
    user_vocab = pickle.load(f)

# === embedding 로드 ===
print("Loading recipe embeddings...")
recipe_embs = np.load(RECIPE_EMBS_PATH)

# === 모델 생성 (compile 절대 X) ===
print("Building model...")
model = TwoTower(
    user_vocab=user_vocab,
    recipe_vocab=recipe_vocab,
    dim=EMBED_DIM
)
model.built = True
# === 기존 weight 로드 (optimizer/loss 변수 무시) ===
print("Loading existing weights...")
load_status = model.load_weights(str(ORIGINAL_WEIGHTS))

try:
    load_status.expect_partial()
except:
    pass

# === 순수 가중치로 다시 저장 ===
print("Saving pure weights...")
model.save_weights(str(PURE_WEIGHTS))

print("✔ 완료! saved at:", PURE_WEIGHTS)
