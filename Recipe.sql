CREATE TABLE recipe (
    -- 레시피 고유 ID
    recipe_id CHAR(20) PRIMARY KEY,
    -- 요리 이름
    name VARCHAR(100) NOT NULL,
    -- 재료 리스트 (예: ["두부", "된장", "애호박"])
    ingredients TEXT,
    -- 재료별 필요량 (예: {"두부":150,"된장":20})
    ingredient_qty JSON,
    -- 조리 순서
    cooking_steps TEXT,
    -- 조리 시간 (예: "30분")
    cooking_time VARCHAR(50),
    -- 난이도 (예: "쉬움", "보통", "어려움")
    difficulty VARCHAR(20),
    -- 요리 종류 (예: "한식", "양식", "중식")
    cuisine_type VARCHAR(50),
    -- 태그 (예: ["저염식","고단백","다이어트"])
    tags VARCHAR(255),
    -- 칼로리 (예: "320 kcal")
    calories VARCHAR(20),
    -- 영양소 정보 (예: {"탄수화물":"40g","단백질":"15g","지방":"8g"})
    nutrients TEXT,
    -- 레시피 이미지 URL
    img_url VARCHAR(255)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='레시피 정보 테이블';
