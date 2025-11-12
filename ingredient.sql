SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ingredient;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE ingredient (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  fridge_id    BIGINT NOT NULL,
  name         VARCHAR(100) NOT NULL,
  quantity     DECIMAL(10,2) DEFAULT 1.00,
  unit         VARCHAR(20) NULL,        -- g, ml, 개 등
  category_id  BIGINT NULL,
  expire_date  DATE NULL,
  status       ENUM('fresh','near_expiry','expired') DEFAULT 'fresh',

  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_ing_fridge (fridge_id),
  KEY idx_ing_expire (expire_date),
  KEY idx_ing_category (category_id),

  CONSTRAINT fk_ing_fridge
    FOREIGN KEY (fridge_id)   REFERENCES fridge(id)                ON DELETE CASCADE,
  CONSTRAINT fk_ing_category
    FOREIGN KEY (category_id) REFERENCES ingredient_category(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
