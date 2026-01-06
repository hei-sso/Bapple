CREATE TABLE recipe_ingredient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    ingredient_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NULL,
    unit VARCHAR(30) NULL,

    CONSTRAINT fk_recipe_ing_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipe(recipe_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_ing_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredient(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;
