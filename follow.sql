CREATE TABLE follow (
    follow_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 팔로우를 신청한 사람(user.user_id 참조)
    follower_id BIGINT NOT NULL,
    -- 팔로우를 당한 사람(user.user_id 참조)
    following_id BIGINT NOT NULL,
    
    -- 관계 생성 시점
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 외래키 설정(user 테이블의 user_id 참조)
    FOREIGN KEY (follower_id) REFERENCES user(user_id),
    FOREIGN KEY (following_id) REFERENCES user(user_id),
    
    -- A가 B를 중복해서 팔로우할 수 없도록 UNIQUE 제약조건 설정
    UNIQUE KEY (follower_id, following_id)
);
