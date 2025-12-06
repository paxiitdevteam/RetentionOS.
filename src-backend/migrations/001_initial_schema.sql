-- RetentionOS Initial Database Schema
-- MariaDB/MySQL compatible
-- Run this migration to create all tables

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  plan VARCHAR(255),
  region VARCHAR(50),
  churn_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_external_id (external_id),
  INDEX idx_users_email (email),
  INDEX idx_users_plan (plan),
  INDEX idx_users_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  value DECIMAL(10, 2),
  status VARCHAR(50),
  cancel_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subscriptions_user_id (user_id),
  INDEX idx_subscriptions_stripe_id (stripe_subscription_id),
  INDEX idx_subscriptions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS flows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  steps JSON NOT NULL,
  ranking_score INT DEFAULT 0,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_flows_language (language),
  INDEX idx_flows_ranking_score (ranking_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  flow_id INT,
  offer_type VARCHAR(255),
  accepted BOOLEAN DEFAULT false,
  revenue_saved DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE SET NULL,
  INDEX idx_offer_events_user_id (user_id),
  INDEX idx_offer_events_flow_id (flow_id),
  INDEX idx_offer_events_created_at (created_at),
  INDEX idx_offer_events_offer_type (offer_type),
  INDEX idx_offer_events_accepted (accepted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS churn_reasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  reason_code VARCHAR(255),
  reason_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_churn_reasons_user_id (user_id),
  INDEX idx_churn_reasons_reason_code (reason_code),
  INDEX idx_churn_reasons_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'analyst', 'readonly') DEFAULT 'readonly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_accounts_email (email),
  INDEX idx_admin_accounts_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_used TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (owner_id) REFERENCES admin_accounts(id) ON DELETE CASCADE,
  INDEX idx_api_keys_key (`key`),
  INDEX idx_api_keys_owner_id (owner_id),
  INDEX idx_api_keys_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  action TEXT NOT NULL,
  ip VARCHAR(45),
  description TEXT,
  resource_id INT,
  before_state JSON,
  after_state JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_accounts(id) ON DELETE SET NULL,
  INDEX idx_audit_logs_admin_id (admin_id),
  INDEX idx_audit_logs_action (action(255)),
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_resource_id (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_weights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  weight_name VARCHAR(255) UNIQUE NOT NULL,
  weight_value DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_weights_weight_name (weight_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  offer_type VARCHAR(50) NOT NULL,
  segment VARCHAR(50),
  total_shown INT DEFAULT 0,
  total_accepted INT DEFAULT 0,
  acceptance_rate DECIMAL(5, 2) DEFAULT 0.0,
  avg_revenue_saved DECIMAL(10, 2) DEFAULT 0.0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_offer_performance_offer_type (offer_type),
  INDEX idx_offer_performance_segment (segment),
  UNIQUE KEY idx_offer_performance_unique (offer_type, segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_template VARCHAR(255) NOT NULL,
  offer_type VARCHAR(50) NOT NULL,
  total_shown INT DEFAULT 0,
  total_accepted INT DEFAULT 0,
  acceptance_rate DECIMAL(5, 2) DEFAULT 0.0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_message_performance_template (message_template),
  INDEX idx_message_performance_offer_type (offer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
