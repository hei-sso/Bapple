CREATE TABLE refresh_token (
    refresh_token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 이 토큰이 어떤 유저의 것인지 연결
    user_id BIGINT NOT NULL,
    
    -- 실제 리프레시 토큰 문자열 (조회할 수 있도록 UNIQUE 설정)
    token VARCHAR(512) NOT NULL UNIQUE,
    
    -- 이 토큰의 만료 시각
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- user 테이블의 회원이 탈퇴하면, 모든 토큰 함께 자동 삭제 (ON DELETE CASCADE)
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);