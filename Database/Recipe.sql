CREATE TABLE recipe (
    -- 레시피 고유 ID (CSV가 24글자라서 이렇게)
    recipe_id VARCHAR(50) PRIMARY KEY,

    -- 요리 이름
    name VARCHAR(100) NOT NULL,

    -- 재료 리스트
    ingredients TEXT,

    -- 재료별 필요량
    ingredient_qty JSON,

    -- 조리 순서
    cooking_steps TEXT,

    -- 조리 시간
    cooking_time VARCHAR(50),

    -- 난이도
    difficulty VARCHAR(20),

    -- 요리 종류
    cuisine_type VARCHAR(50),

    -- 태그
    tags VARCHAR(255),

    -- 칼로리
    calories VARCHAR(20),

    -- 영양소 정보
    nutrients TEXT,

    -- 레시피 이미지 URL
    img_url VARCHAR(255)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='레시피 정보 테이블';
