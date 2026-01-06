CREATE TABLE recipe_review (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
    admin_id  BIGINT NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    comment TEXT NULL,
    reviewed_at TIMESTAMP NULL,

    CONSTRAINT fk_review_recipe
      FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id)
      ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;
