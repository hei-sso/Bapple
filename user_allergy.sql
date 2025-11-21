CREATE TABLE user_allergy (
    user_id    BIGINT NOT NULL,
    allergy_id VARCHAR(50) NOT NULL,

    PRIMARY KEY (user_id, allergy_id),

    CONSTRAINT fk_user_allergy_user
        FOREIGN KEY (user_id)
        REFERENCES user(user_id) ON DELETE CASCADE,

    CONSTRAINT fk_user_allergy_allergy
        FOREIGN KEY (allergy_id)
        REFERENCES allergy(allergy_id)
)
ENGINE=InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;
