USE railway;

-- 안전장치: 혹시 모를 외래키 에러 방지
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE meal_plan (
    meal_plan_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- 개인 식단
    user_id   BIGINT NULL,

    -- 그룹 식단 (CHAR(8)로 변경됨)
    group_id  CHAR(8) NULL,

    -- 날짜 + 끼니
    plan_date DATE NOT NULL,
    meal_type ENUM('BREAKFAST','LUNCH','DINNER','SNACK') NOT NULL,

    -- 레시피 연결 (기존 설정 유지)
    recipe_id VARCHAR(50) COLLATE utf8mb4_general_ci NULL,

    title     VARCHAR(100) NULL,
    memo      TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                 ON UPDATE CURRENT_TIMESTAMP,

    -- FK: 그룹
    CONSTRAINT fk_meal_plan_group
      FOREIGN KEY (group_id) REFERENCES user_group(group_id)
      ON DELETE CASCADE,

    -- FK: 유저
    CONSTRAINT fk_meal_plan_user
      FOREIGN KEY (user_id) REFERENCES user(user_id)
      ON DELETE CASCADE,

    -- FK: 레시피 (레시피 삭제 시 식단은 남기고 NULL 처리)
    CONSTRAINT fk_meal_plan_recipe
      FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id)
      ON DELETE SET NULL
)
ENGINE=InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;

-- 안전장치 해제
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;
