SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS fridge_share;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE fridge_share (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  fridge_id   BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,                        -- 공유받는 사용자
  role        ENUM('viewer','editor') DEFAULT 'viewer',
  status      ENUM('pending','accepted','blocked') DEFAULT 'accepted',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_fridge_share (fridge_id, user_id),
  KEY idx_share_user (user_id),

  CONSTRAINT fk_share_fridge
    FOREIGN KEY (fridge_id) REFERENCES fridge(id)       ON DELETE CASCADE,
  CONSTRAINT fk_share_user
    FOREIGN KEY (user_id)   REFERENCES `user`(user_id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
