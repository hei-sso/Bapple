USE railway;

SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;


SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

CREATE TABLE user_group (
  group_id      CHAR(8) NOT NULL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  owner_user_id BIGINT NOT NULL,
  visibility    ENUM('PRIVATE','INVITE_ONLY','PUBLIC')
                NOT NULL DEFAULT 'PRIVATE',
  
  group_image_url TEXT NULL,
  is_fridge_shared VARCHAR(20) DEFAULT 'owner_only',

  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_group_owner
    FOREIGN KEY (owner_user_id) REFERENCES user(user_id)
      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_user_group_owner ON user_group (owner_user_id);

-- 외래키 감시 다시 켜기
SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;
