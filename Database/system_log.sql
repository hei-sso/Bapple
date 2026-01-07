USE railway;

SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

CREATE TABLE system_log (
    log_id        BIGINT AUTO_INCREMENT PRIMARY KEY,   -- 로그 PK
    level         ENUM('DEBUG','INFO','WARN','ERROR') NOT NULL DEFAULT 'INFO',
    source        VARCHAR(100) NULL,                   -- 발생 위치(모듈/클래스 등)
    message       TEXT NOT NULL,                       -- 메시지
    metadata      JSON NULL,                           -- 부가 정보 (JSON)
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;

CREATE INDEX idx_system_log_level_created
  ON system_log (level, created_at);
