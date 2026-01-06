CREATE TABLE user_warning (
    warning_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_warn_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE
);
