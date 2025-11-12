SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_disliked_ingredient;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user_disliked_ingredient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ingredient VARCHAR(100) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dislike_user
      FOREIGN KEY (user_id)
      REFERENCES `user`(user_id)
      ON DELETE CASCADE
);

CREATE INDEX idx_dislike_user ON user_disliked_ingredient(user_id);
