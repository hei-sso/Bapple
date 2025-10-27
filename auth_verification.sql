CREATE TABLE auth_verification (
    verification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code CHAR(6) NOT NULL, 
    
    -- 용도 ('SIGN_UP'- 회원가입, 'RESET_PASSWORD'-비밀번호 재설정)
    purpose VARCHAR(20) NOT NULL,
    
    -- 만료 시각 (예: 3 or 5분 뒤)
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
