<?php
require_once __DIR__ . '/../config/Database.php';

try {
    $db = Database::getInstance();
    
    $sql = "
    CREATE TABLE IF NOT EXISTS `chat_sessions` (
      `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
      `session_token` varchar(64) NOT NULL,
      `user_id` int UNSIGNED NULL,
      `guest_name` varchar(100) NULL,
      `status` enum('active','closed') NOT NULL DEFAULT 'active',
      `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `session_token` (`session_token`),
      FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS `chat_messages` (
      `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
      `session_id` int UNSIGNED NOT NULL,
      `sender_type` enum('customer','admin') NOT NULL,
      `sender_id` int UNSIGNED NULL,
      `message` text NOT NULL,
      `is_read` tinyint(1) NOT NULL DEFAULT 0,
      `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($sql);
    echo "Migration successful.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
