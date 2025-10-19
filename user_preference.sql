CREATE TABLE user_preference (
    user_id BIGINT PRIMARY KEY,
    
    disliked_ingredients TEXT,                  
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);