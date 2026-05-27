CREATE DATABASE IF NOT EXISTS product_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE product_db;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NULL,
  parent_id INT NULL,
  image_url VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_parent_id (parent_id),
  INDEX idx_categories_slug (slug),
  CONSTRAINT fk_categories_parent_id
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT NULL,
  short_description TEXT NULL,
  brand VARCHAR(120) NOT NULL,
  sku VARCHAR(120) NOT NULL UNIQUE,
  price DECIMAL(15,0) NOT NULL,
  original_price DECIMAL(15,0) NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id INT NOT NULL,
  `condition` VARCHAR(100) NULL,
  badge VARCHAR(100) NULL,
  weight FLOAT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  average_rating FLOAT NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_slug (slug),
  INDEX idx_products_sku (sku),
  INDEX idx_products_brand (brand),
  INDEX idx_products_is_active (is_active),
  CONSTRAINT fk_products_category_id
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_images_product_id (product_id),
  CONSTRAINT fk_product_images_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_specs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  spec_name VARCHAR(150) NOT NULL,
  spec_value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  INDEX idx_product_specs_product_id (product_id),
  CONSTRAINT fk_product_specs_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlists_user_product (user_id, product_id),
  INDEX idx_wishlists_user_id (user_id),
  INDEX idx_wishlists_product_id (product_id),
  CONSTRAINT fk_wishlists_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
