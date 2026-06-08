CREATE DATABASE IF NOT EXISTS order_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE order_db;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NULL,
  purchase_channel ENUM('online', 'instore') NOT NULL DEFAULT 'online',
  status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(15,0) NOT NULL,
  shipping_fee DECIMAL(15,0) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,0) NOT NULL,
  shipping_name VARCHAR(150) NULL,
  shipping_phone VARCHAR(20) NULL,
  shipping_address VARCHAR(255) NULL,
  shipping_ward VARCHAR(100) NULL,
  shipping_district VARCHAR(100) NULL,
  shipping_city VARCHAR(100) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_order_number (order_number),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_purchase_channel (purchase_channel),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NULL,
  variant_key VARCHAR(50) NULL,
  variant_name VARCHAR(255) NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(15,0) NOT NULL,
  product_image VARCHAR(500) NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(15,0) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id),
  INDEX idx_order_items_variant_id (variant_id),
  CONSTRAINT fk_order_items_order_id
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled') NOT NULL,
  note TEXT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_status_history_order_id (order_id),
  CONSTRAINT fk_order_status_history_order_id
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warranties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warranty_code VARCHAR(60) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(120) NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  duration_months INT NOT NULL DEFAULT 12,
  start_date TIMESTAMP NULL,
  end_date TIMESTAMP NULL,
  status ENUM('active', 'expired', 'claimed', 'voided') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warranties_order_id (order_id),
  INDEX idx_warranties_order_number (order_number),
  INDEX idx_warranties_product_id (product_id),
  INDEX idx_warranties_customer_phone (customer_phone),
  INDEX idx_warranties_serial_number (serial_number),
  INDEX idx_warranties_status (status),
  CONSTRAINT fk_warranties_order_id
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
