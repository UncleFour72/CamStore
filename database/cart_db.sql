CREATE DATABASE IF NOT EXISTS cart_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cart_db;

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_carts_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(15,0) NOT NULL,
  product_image VARCHAR(500) NULL,
  variant_key VARCHAR(50) NOT NULL DEFAULT 'body',
  variant_name VARCHAR(255) NULL,
  variant_price DECIMAL(15,0) NULL,
  variant_image VARCHAR(500) NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cart_items_cart_id (cart_id),
  INDEX idx_cart_items_product_id (product_id),
  INDEX idx_cart_items_variant_id (variant_id),
  UNIQUE KEY uq_cart_items_cart_product_variant (cart_id, product_id, variant_key),
  CONSTRAINT fk_cart_items_cart_id
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
