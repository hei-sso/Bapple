import pandas as pd
import ast
from typing import Tuple, Dict

def parse_tags(val):
    if pd.isna(val):
        return []
    try:
        return [x.strip() for x in ast.literal_eval(val)]
    except Exception:
        cleaned = str(val).replace("[", "").replace("]", "").replace("'", "")
        return [x.strip() for x in cleaned.split(",") if x.strip()]

def parse_ingredients(val):
    if pd.isna(val):
        return []
    return [x.strip() for x in str(val).split("|") if x.strip()]

def load_recipe_dataframe(csv_path: str) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Colab에서 학습할 때 사용했던 학습용 CSV를 다시 로드.
    recipe_id, ingredients, tags, cuisine_type, diet_type 등이 포함되어 있어야 함.
    """
    df = pd.read_csv(csv_path)
    df["recipe_id"] = df["recipe_id"].astype(str)
    df["tag_list"] = df["tags"].apply(parse_tags)
    df["ingredient_list"] = df["ingredients"].apply(parse_ingredients)

    id_to_dfidx = {rid: i for i, rid in enumerate(df["recipe_id"].tolist())}
    return df, id_to_dfidx
