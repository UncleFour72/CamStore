CREATE DATABASE IF NOT EXISTS notification_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE notification_db;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_type ENUM('user', 'admin') NOT NULL,
  recipient_id INT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(80) NOT NULL DEFAULT 'system',
  entity_type VARCHAR(80) NULL,
  entity_id VARCHAR(80) NULL,
  data JSON NULL,
  dedupe_key VARCHAR(180) NULL UNIQUE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notifications_recipient (recipient_type, recipient_id),
  INDEX idx_notifications_read_at (read_at),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_entity (entity_type, entity_id),
  UNIQUE INDEX idx_notifications_dedupe_key (dedupe_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
