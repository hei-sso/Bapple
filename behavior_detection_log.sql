USE railway;

SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

CREATE TABLE behavior_detection_log (
    detection_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT NULL,                 -- 의심 유저 (비로그인일 수도 있어서 NULL 허용)
    behavior_type  ENUM('SPAM','BOT','ABUSE','LOGIN_ABNORMAL','OTHER')
                     NOT NULL,
    score          DECIMAL(5,2) NULL,           -- 위험 점수 (예: 0~100)
    description    TEXT NULL,                   -- 상세 설명
    ip_address     VARCHAR(45) NULL,            -- IPv4/IPv6
    user_agent     VARCHAR(255) NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_behavior_log_user
      FOREIGN KEY (user_id) REFERENCES user(user_id)
      ON DELETE SET NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_behavior_log_type_created
  ON behavior_detection_log (behavior_type, created_at);

CREATE INDEX idx_behavior_log_user
  ON behavior_detection_log (user_id, created_at);
