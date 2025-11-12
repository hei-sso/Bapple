SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS fridge;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE fridge (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id  BIGINT NOT NULL,
  name           VARCHAR(60) NOT NULL DEFAULT '내 냉장고',
  visibility     ENUM('private','friends','public') DEFAULT 'private',
  is_active      TINYINT(1) DEFAULT 1,
  is_default     TINYINT(1) DEFAULT 0,

  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_fridge_owner (owner_user_id),
  CONSTRAINT fk_fridge_owner
    FOREIGN KEY (owner_user_id) REFERENCES `user`(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
