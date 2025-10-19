CREATE TABLE user_health_condition (
    user_id BIGINT NOT NULL,
    health_condition_id INT NOT NULL,
    
    PRIMARY KEY (user_id, health_condition_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (health_condition_id) REFERENCES health_condition(health_condition_id)
);