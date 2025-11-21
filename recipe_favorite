USE railway;

-- 외래키 잠시 끄기
SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;


CREATE TABLE recipe_favorite (
    user_id    BIGINT NOT NULL,
    recipe_id  VARCHAR(50)
                 CHARACTER SET utf8mb4
                 COLLATE utf8mb4_general_ci
                 NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, recipe_id),

    CONSTRAINT fk_recipe_fav_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_fav_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipe(recipe_id)
        ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;

-- 외래키 원래대로
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;
