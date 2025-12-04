CREATE TABLE ingredient (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  category_id  BIGINT NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_ing_category (category_id),

  CONSTRAINT fk_ing_category
    FOREIGN KEY (category_id)
    REFERENCES ingredient_category(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
