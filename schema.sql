
-- Esper AI Call Center - MySQL Schema

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('SUPER_ADMIN', 'CALL_CENTER_ADMIN', 'DESIGN_ADMIN') NOT NULL,
  `is_2fa_enabled` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Centers Table
CREATE TABLE IF NOT EXISTS `call_centers` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `billing_rate_type` ENUM('per_call', 'per_hour', 'per_day', 'per_month') DEFAULT NULL,
  `billing_amount` DECIMAL(10, 4) DEFAULT NULL, -- Increased precision for rates like $0.0025
  `billing_currency` ENUM('USD', 'EUR', 'GBP') DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Call Center Assignments (Many-to-Many for non-SuperAdmins)
CREATE TABLE IF NOT EXISTS `user_call_center_assignments` (
  `user_id` VARCHAR(255) NOT NULL,
  `call_center_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`user_id`, `call_center_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns Table
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'paused', 'archived', 'draft') NOT NULL,
  `target_audience` TEXT DEFAULT NULL,
  `call_objective` TEXT DEFAULT NULL,
  `tone` VARCHAR(255) DEFAULT NULL,
  `user_master_script_text` TEXT DEFAULT NULL,
  `created_date` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Flows Table (Stores structured JSON call flows)
CREATE TABLE IF NOT EXISTS `call_flows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `default_exit_step_key` VARCHAR(255) DEFAULT NULL,
  `steps_json` JSON NOT NULL,
  `is_master` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Voices Table
CREATE TABLE IF NOT EXISTS `voices` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(255) DEFAULT NULL,
  `settings_json` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agents Table (Agent Configurations)
CREATE TABLE IF NOT EXISTS `agents` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `campaign_id` VARCHAR(255) NOT NULL,
  `voice_id` VARCHAR(255) NOT NULL,
  `background_noise` VARCHAR(255) DEFAULT NULL,
  `background_noise_volume` INT DEFAULT NULL, -- 0-100
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voice_id`) REFERENCES `voices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bots Table
CREATE TABLE IF NOT EXISTS `bots` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `campaign_id` VARCHAR(255) NOT NULL,
  `agent_id` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'inactive', 'error') NOT NULL,
  `active_duty_start_time` TIME DEFAULT NULL,
  `active_duty_end_time` TIME DEFAULT NULL,
  `creation_date` TIMESTAMP NOT NULL,
  `last_activity` TIMESTAMP NULL DEFAULT NULL,
  `total_calls` INT DEFAULT 0,
  `successful_calls` INT DEFAULT 0,
  `failed_calls` INT DEFAULT 0,
  `busy_calls` INT DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `invoice_number` VARCHAR(255) NOT NULL UNIQUE,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `billing_period_start` DATE DEFAULT NULL,
  `billing_period_end` DATE DEFAULT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `tax_rate` DECIMAL(5, 4) DEFAULT NULL, -- e.g., 0.0500 for 5%
  `tax_amount` DECIMAL(12, 2) DEFAULT NULL,
  `total` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled') NOT NULL,
  `paid_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS `invoice_line_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit_price` DECIMAL(10, 4) NOT NULL, -- Increased precision for unit price
  `total_price` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call Logs Table
CREATE TABLE IF NOT EXISTS `call_logs` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `call_center_id` VARCHAR(255) NOT NULL,
  `bot_id` VARCHAR(255) NOT NULL,
  `bot_name` VARCHAR(255) DEFAULT NULL,
  `campaign_id` VARCHAR(255) NOT NULL,
  `campaign_name` VARCHAR(255) DEFAULT NULL,
  `lead_id` VARCHAR(255) DEFAULT NULL,
  `lead_name` VARCHAR(255) DEFAULT NULL,
  `lead_phone_number` VARCHAR(50) NOT NULL,
  `lead_city` VARCHAR(255) DEFAULT NULL,
  `lead_age` INT DEFAULT NULL,
  `call_start_time` TIMESTAMP NOT NULL,
  `call_end_time` TIMESTAMP NULL DEFAULT NULL,
  `call_duration_seconds` INT DEFAULT NULL,
  `call_result` ENUM('answered_success', 'answered_dnc_requested', 'answered_declined', 'busy', 'failed_technical', 'voicemail_left', 'voicemail_full', 'no_answer', 'blocked_by_dnc') NOT NULL,
  `recording_url` VARCHAR(2048) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `marked_dnc` BOOLEAN DEFAULT FALSE,
  INDEX `idx_call_logs_phone_number` (`lead_phone_number`),
  INDEX `idx_call_logs_call_center_id_start_time` (`call_center_id`, `call_start_time`),
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DNC (Do Not Call) List Table
CREATE TABLE IF NOT EXISTS `dnc_list` (
  `phone_number` VARCHAR(50) NOT NULL PRIMARY KEY,
  `reason` TEXT DEFAULT NULL,
  `added_date` TIMESTAMP NOT NULL,
  `source_call_log_id` VARCHAR(255) DEFAULT NULL,
  `added_by_bot_id` VARCHAR(255) DEFAULT NULL,
  `added_by_user_id` VARCHAR(255) DEFAULT NULL,
  `call_center_id_source` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`source_call_log_id`) REFERENCES `call_logs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`added_by_bot_id`) REFERENCES `bots`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`added_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`call_center_id_source`) REFERENCES `call_centers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL, -- Denormalized
  `action` VARCHAR(255) NOT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `call_center_id` VARCHAR(255) DEFAULT NULL,
  `call_center_name` VARCHAR(255) DEFAULT NULL, -- Denormalized
  INDEX `idx_audit_logs_user_id` (`user_id`),
  INDEX `idx_audit_logs_action` (`action`),
  INDEX `idx_audit_logs_call_center_id` (`call_center_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE, -- Or SET NULL depending on policy
  FOREIGN KEY (`call_center_id`) REFERENCES `call_centers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
    