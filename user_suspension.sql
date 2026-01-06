CREATE TABLE user_suspension (
    suspension_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NULL,
    reason VARCHAR(255),
    status ENUM('ACTIVE','ENDED') DEFAULT 'ACTIVE',

    CONSTRAINT fk_suspend_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE
);
