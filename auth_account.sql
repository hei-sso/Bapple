CREATE TABLE auth_account (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT NOT NULL,
  provider         ENUM('kakao') NOT NULL,
  provider_uid     VARCHAR(128) NOT NULL,
  access_token     VARBINARY(1024) NULL,
  token_expires_at DATETIME NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_uid (provider, provider_uid),
  CONSTRAINT fk_auth_account_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
