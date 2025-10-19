CREATE TABLE user_setting (
    user_id BIGINT PRIMARY KEY,                      
    
    -- 전체 알림 설정
    allow_notifications BOOLEAN DEFAULT TRUE,
    
    -- 야간 알림 설정
    allow_night_notifications BOOLEAN DEFAULT FALSE,
    
    -- 다크/라이트 모드 설정
    dark_mode VARCHAR(20) DEFAULT 'SYSTEM',          
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);