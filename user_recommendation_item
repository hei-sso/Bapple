CREATE TABLE user_recommendation_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    recipe_id VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
    rank_no INT NOT NULL,                         -- AI 응답 순서대로 1~50
    is_shown    TINYINT(1) NOT NULL DEFAULT 0,    -- UI에 보여줬으면 1
    is_selected TINYINT(1) NOT NULL DEFAULT 0,    -- 사용자가 먹겠다고 고른 것
    is_rejected TINYINT(1) NOT NULL DEFAULT 0,    -- 안 고르고 버려진 것
    shown_at    TIMESTAMP NULL,
    selected_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_uri_batch
        FOREIGN KEY (batch_id)
        REFERENCES user_recommendation_batch(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uri_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipe(recipe_id),

    CONSTRAINT uq_uri_batch_recipe
        UNIQUE (batch_id, recipe_id),

    INDEX idx_uri_batch_flags (batch_id, is_selected, is_rejected, is_shown, rank_no)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
