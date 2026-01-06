CREATE TABLE receipt_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NULL,
    unit VARCHAR(20) NULL,
    expires_at DATE NULL,

    CONSTRAINT fk_receipt_item_receipt
      FOREIGN KEY (receipt_id) REFERENCES receipt(receipt_id)
      ON DELETE CASCADE
);
