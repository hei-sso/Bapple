CREATE TABLE user_allergy (
    user_id BIGINT NOT NULL,
    allergy_id INT NOT NULL,
    
    PRIMARY KEY (user_id, allergy_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (allergy_id) REFERENCES allergy(allergy_id)
);