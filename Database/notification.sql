USE railway;

--  FK 임시 해제
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- FK 원복
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

--  알림 테이블
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,      -- 알림 PK

    -- 누구에게 가는 알림인지
    user_id         BIGINT NOT NULL,                        -- 수신자

    -- 알림 성격
    type            ENUM(
                        'SYSTEM',       -- 시스템 공지/점검
                        'NOTICE',       -- 공지사항 알림
                        'REPORT',       -- 신고 처리 결과
                        'FRIEND',       -- 친구/팔로우 관련
                        'GROUP',        -- 그룹 초대/변경
                        'MEAL_PLAN',    -- 식단/달력 관련
                        'OTHER'
                    ) NOT NULL DEFAULT 'SYSTEM',

    title           VARCHAR(150) NULL,                      -- 알림 제목(간단 요약)
    message         TEXT NOT NULL,                          -- 알림 내용

    -- 클릭 시 이동할 수 있는 링크 (앱 딥링크 or 웹 URL)
    link_url        VARCHAR(500) NULL,

    -- 연관된 도메인
    notice_id       BIGINT NULL,                            -- 연결된 공지 (있으면)
    report_id       BIGINT NULL,                            -- 연결된 신고 (있으면)

    -- 읽음 처리
    is_read         TINYINT(1) NOT NULL DEFAULT 0,          -- 0: 미읽음, 1: 읽음
    read_at         DATETIME NULL,                          -- 읽은 시각

    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- FK
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_notice
        FOREIGN KEY (notice_id) REFERENCES notice(notice_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notification_report
        FOREIGN KEY (report_id) REFERENCES report(report_id)
        ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;

--  조회용 인덱스들
-- 유저별 미읽은 알림 조회
CREATE INDEX idx_notification_user_unread
  ON notification (user_id, is_read, created_at);

-- 타입별/시간순 조회
CREATE INDEX idx_notification_type_created
  ON notification (type, created_at);
