USE railway;

-- FK 임시 해제
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- FK 원복
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

-- 공지 테이블 생성
CREATE TABLE notice (
    notice_id      BIGINT AUTO_INCREMENT PRIMARY KEY,      -- 공지 pk

    title          VARCHAR(150) NOT NULL,                  -- 제목
    content        TEXT NOT NULL,                          -- 내용 (마크다운/HTML 가능)

    status         ENUM('DRAFT','PUBLISHED','HIDDEN')
                   NOT NULL DEFAULT 'DRAFT',               -- 상태

    -- 누가 작성했는지 (관리자 계정도 user 테이블 사용)
    author_id      BIGINT NULL,

    -- 고정 공지 여부
    pinned         TINYINT(1) NOT NULL DEFAULT 0,          -- 1이면 상단 고정

    -- 대상 범위
    target_type    ENUM('ALL','GROUP','USER')
                   NOT NULL DEFAULT 'ALL',
    target_group_id BIGINT NULL,                           -- 특정 그룹 대상(선택)
    target_user_id  BIGINT NULL,                           -- 특정 사용자 대상(선택)

    view_count     INT NOT NULL DEFAULT 0,                 -- 조회수

    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    published_at   DATETIME NULL,                          -- 실제 게시 시간

    -- FK
    CONSTRAINT fk_notice_author
        FOREIGN KEY (author_id) REFERENCES user(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notice_group
        FOREIGN KEY (target_group_id) REFERENCES user_group(group_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notice_user
        FOREIGN KEY (target_user_id) REFERENCES user(user_id)
        ON DELETE SET NULL
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;

-- 인덱스
CREATE INDEX idx_notice_status_pinned
  ON notice (status, pinned, created_at);

CREATE INDEX idx_notice_target_type
  ON notice (target_type, target_group_id, target_user_id);
