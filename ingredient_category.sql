SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ingredient_category;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE ingredient_category (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  parent_id  BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_category_name (name),
  CONSTRAINT fk_category_parent
    FOREIGN KEY (parent_id) REFERENCES ingredient_category(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
