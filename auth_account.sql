-- 스키마 선택 (필요 시)
USE railway;

-- 안전 초기화: 트리거 → 테이블 순서
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trg_auth_account_set_exp;
DROP TRIGGER IF EXISTS trg_auth_account_rotate_exp;
DROP TABLE IF EXISTS auth_account;

SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

-- 본 테이블
CREATE TABLE auth_account (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT NOT NULL,
  provider         ENUM('kakao') NOT NULL,
  provider_uid     VARCHAR(128) NOT NULL,
  access_token     VARBINARY(1024) NULL,      -- 서버에서 암호화 저장 권장
  token_expires_at DATETIME NULL,             -- 트리거로 자동: 현재+5분
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_uid (provider, provider_uid),
  CONSTRAINT fk_auth_account_user
    FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 인덱스(재실행 안전)
DROP INDEX IF EXISTS idx_auth_account_expiry ON auth_account;
CREATE INDEX idx_auth_account_expiry ON auth_account (token_expires_at);

-- (추천) 검증/조회용 복합 인덱스
DROP INDEX IF EXISTS idx_auth_account_user ON auth_account;
CREATE INDEX idx_auth_account_user ON auth_account (user_id, provider, provider_uid);

-- 5분 만료/갱신 트리거
DELIMITER //

CREATE TRIGGER trg_auth_account_set_exp
BEFORE INSERT ON auth_account
FOR EACH ROW
BEGIN
  IF NEW.token_expires_at IS NULL THEN
    SET NEW.token_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE);
  END IF;
END//

CREATE TRIGGER trg_auth_account_rotate_exp
BEFORE UPDATE ON auth_account
FOR EACH ROW
BEGIN
  IF (NEW.access_token IS NOT NULL
      AND (OLD.access_token IS NULL OR NEW.access_token <> OLD.access_token)) THEN
    SET NEW.token_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE);
  END IF;
END//

DELIMITER ;
