SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS password_reset_token;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE password_reset_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    user_id BIGINT NOT NULL,                         -- FK : user.user_id
    token VARCHAR(255) NOT NULL,                     -- 인증용 랜덤 문자열
    expires_at DATETIME NOT NULL,                    -- 만료 시각
    used TINYINT(1) DEFAULT 0,                       -- 사용 여부 (0=미사용, 1=사용)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
      FOREIGN KEY (user_id)
        REFERENCES `user`(user_id)
        ON DELETE CASCADE
);

-- 검색 성능 향상
CREATE INDEX idx_reset_user ON password_reset_token(user_id);
CREATE INDEX idx_reset_token ON password_reset_token(token);
