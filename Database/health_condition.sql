CREATE TABLE health_condition (
    health_condition_id VARCHAR(50) PRIMARY KEY,
    health_condition_name VARCHAR(50) NOT NULL UNIQUE,
    tags VARCHAR(255) NULL
);
