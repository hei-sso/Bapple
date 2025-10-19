CREATE TABLE user (
	-- 1. 내부 식별용 PK (절대 노출 금지)
	user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
	-- 2. 친구 추가용 고유ID(영어 대문자+숫자 조합 8자리 고정)
    friend_code CHAR(8) NOT NULL UNIQUE,
    
    -- 3. 프로필(중복 가능)
    nickname VARCHAR(12),
    profile_image_url VARCHAR(2083),
    birthday DATE,
    gender VARCHAR(10),
    
    -- 4. 인증
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255), -- 비밀번호(규칙 상관 없이 암호화된 해시값 저장)
    kakao_id VARCHAR(255) UNIQUE,
    provider VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20),
    
    -- 5. 상태 및 시각
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
    
    

