CREATE TABLE user_recommendation_batch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,   -- batch_id
    user_id BIGINT NOT NULL,
    diseases_json    TEXT NULL,
    allergies_json   TEXT NULL,
    fridge_ings_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_urb_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
