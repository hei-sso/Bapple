USE railway;

-- FK 잠시 끄기
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 테이블 생성 (이름: group_member)
CREATE TABLE group_member (
    group_id   CHAR(8) NOT NULL,        -- user_group과 동일한 CHAR(8)
    user_id    BIGINT NOT NULL,
    role       ENUM('OWNER','ADMIN','MEMBER')
                 NOT NULL DEFAULT 'MEMBER',
    joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_pinned  BOOLEAN DEFAULT FALSE,   -- 상단 고정 여부

    -- 복합 키 (한 유저는 한 그룹에 한 번만 가입)
    PRIMARY KEY (group_id, user_id),

    -- FK: 그룹 삭제 시 멤버도 자동 탈퇴
    CONSTRAINT fk_group_member_group
        FOREIGN KEY (group_id) REFERENCES user_group(group_id)
        ON DELETE CASCADE,

    -- FK: 유저 탈퇴 시 멤버 정보 삭제
    CONSTRAINT fk_group_member_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 유저별 가입 그룹 조회를 위한 인덱스
CREATE INDEX idx_group_member_user ON group_member (user_id);

-- 안전장치 해제
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;
