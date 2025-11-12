SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_preference;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user_preference (
    user_id BIGINT PRIMARY KEY,   -- 1:1 관계

    -- 화면 모드: system / light / dark
    theme_mode ENUM('system', 'light', 'dark') DEFAULT 'system',

    -- 알림 설정
    notification_enabled TINYINT(1) DEFAULT 1,         -- 알림 허용
    notification_night_enabled TINYINT(1) DEFAULT 0,   -- 야간 알림 허용 여부

    -- 냉장고 공개 범위
    visibility ENUM('private', 'friends', 'public') DEFAULT 'private',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_preference_user
      FOREIGN KEY (user_id)
      REFERENCES `user`(user_id)
      ON DELETE CASCADE
);
