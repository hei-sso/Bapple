CREATE TABLE allergy (
    allergy_id  VARCHAR(50) PRIMARY KEY,      -- 문자 PK
    allergy_name VARCHAR(50) NOT NULL UNIQUE  -- 알러지명
)
ENGINE=InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_general_ci;
