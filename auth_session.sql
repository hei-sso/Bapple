SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS auth_session;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE auth_session (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,

  user_id           BIGINT NOT NULL,                 -- 필요시 BIGINT UNSIGNED
  session_uuid      CHAR(36) NOT NULL,               -- 서버가 발급한 세션 식별자(UUID v4)
  device_id         VARCHAR(64) NULL,                -- 클라이언트가 주는 디바이스 식별자(옵션)
  user_agent        VARCHAR(255) NULL,               -- UA 저장
  ip_address        VARCHAR(45) NULL,                -- IPv4/IPv6

  expires_at        DATETIME NOT NULL,               -- 세션 만료
  revoked           TINYINT(1) DEFAULT 0,            -- 강제 만료(로그아웃 등)

  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_auth_session_uuid UNIQUE (session_uuid),
  KEY idx_auth_session_user (user_id),
  KEY idx_auth_session_exp (expires_at),

  CONSTRAINT fk_auth_session_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
