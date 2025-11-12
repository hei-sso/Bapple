-- (안전 초기화 옵션) 기존 테이블 제거
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_profile;
SET FOREIGN_KEY_CHECKS = 1;

-- user_profile 테이블
CREATE TABLE user_profile (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id            BIGINT NOT NULL,                       -- FK: user.id (1:1)
  nickname           VARCHAR(50) NULL,                      -- 닉네임(중복 허용/불가 선택: 아래 UNIQUE 토글)
  gender             ENUM('male','female','other') NULL,    -- 성별
  age                TINYINT UNSIGNED NULL,                 -- 0~255 (사실상 0~120 사용 권장)
  profile_image_url  VARCHAR(255) NULL,                     -- 프로필 이미지 경로 (S3 등)
  bio                VARCHAR(300) NULL,                     -- 한 줄 소개(자기소개)
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 한 사용자 당 프로필 1개 제한
  CONSTRAINT uq_user_profile_user UNIQUE (user_id),

  -- 닉네임 검색/중복 체크를 고려한 인덱스
  KEY idx_user_profile_nickname (nickname),

  -- FK
  CONSTRAINT fk_user_profile_user
    FOREIGN KEY (user_id) REFERENCES user(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
