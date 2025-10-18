import os
import re
import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow_recommenders as tfrs
from sklearn.model_selection import train_test_split


# 데이터 로드

DATA_PATH = "hansik_cleaned.csv"
assert os.path.exists(DATA_PATH), f"❌ 파일이 없습니다: {DATA_PATH}"

df = pd.read_csv(DATA_PATH)
print("📂 데이터 로드 완료:", df.shape)
print("📋 컬럼:", df.columns.tolist())

# 태그 컬럼 정제
def split_tags(x):
    if pd.isna(x):
        return []
    parts = re.split(r"[,\|/]", str(x))
    return [p.strip() for p in parts if p.strip()]

df["tag_list"] = df["tags"].apply(split_tags)
df = df[df["tag_list"].map(len) > 0].copy()


# 태그 기반 가짜 사용자-레시피 상호작용 생성

pairs = []
for rid, tags in zip(df["recipe_id"], df["tag_list"]):
    for t in tags:
        pairs.append((f"tag::{t}", str(rid)))

interactions = pd.DataFrame(pairs, columns=["user_id", "recipe_id"]).drop_duplicates()
print("🧩 상호작용 데이터 크기:", interactions.shape)

# 학습/검증 분리
train_df, val_df = train_test_split(interactions, test_size=0.1, random_state=42)

user_ids = sorted(interactions["user_id"].unique().tolist())
recipe_ids = sorted(df["recipe_id"].astype(str).unique().tolist())


# TensorFlow Dataset 변환

def to_ds(pdf):
    return tf.data.Dataset.from_tensor_slices({
        "user_id": tf.constant(pdf["user_id"].values),
        "recipe_id": tf.constant(pdf["recipe_id"].astype(str).values),
    })

BATCH_SIZE = 1024
train_ds = to_ds(train_df).shuffle(200_000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
val_ds = to_ds(val_df).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
candidates_ds = tf.data.Dataset.from_tensor_slices(tf.constant(recipe_ids)).batch(256)

# TFRS Retrieval 모델 정의

class TagRetrievalModel(tfrs.models.Model):
    def __init__(self, user_vocab, recipe_vocab, embed_dim=64):
        super().__init__()
        self.user_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=user_vocab, mask_token=None),
            tf.keras.layers.Embedding(len(user_vocab) + 1, embed_dim),
        ])
        self.recipe_model = tf.keras.Sequential([
            tf.keras.layers.StringLookup(vocabulary=recipe_vocab, mask_token=None),
            tf.keras.layers.Embedding(len(recipe_vocab) + 1, embed_dim),
        ])
        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(candidates=candidates_ds.map(self.recipe_model))
        )

    def compute_loss(self, features, training=False):
        user_emb = self.user_model(features["user_id"])
        recipe_emb = self.recipe_model(features["recipe_id"])
        return self.task(user_emb, recipe_emb)


# 모델 학습

model = TagRetrievalModel(user_ids, recipe_ids, embed_dim=64)
model.compile(optimizer=tf.keras.optimizers.Adagrad(0.1))

print("\n🚀 모델 학습 시작...")
history = model.fit(train_ds, validation_data=val_ds, epochs=3, verbose=2)
print("✅ 학습 완료!")


# 테스트 추천 함수

recipe_embs = model.recipe_model(tf.constant(recipe_ids))

def recommend_for_tags(pref_tags, top_k=5):
    tag_user_ids = [f"tag::{t}" for t in pref_tags]
    user_embs = model.user_model(tf.constant(tag_user_ids))
    user_emb = tf.reduce_mean(user_embs, axis=0, keepdims=True)
    scores = tf.linalg.matmul(user_emb, recipe_embs, transpose_b=True)[0].numpy()
    top_idx = np.argsort(-scores)[:top_k]
    top_recipes = df.iloc[top_idx]
    return top_recipes[["recipe_id", "name", "tags", "calories", "img_url"]]


# 추천 테스트

print("\n🔎 [TEST] 선호 태그=['고단백','저염']")
result = recommend_for_tags(["고단백", "저염"], top_k=5)
print(result)
