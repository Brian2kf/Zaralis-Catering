<?php
// ============================================================
// config/database.php
// Koneksi PDO — dipanggil sekali, digunakan di seluruh aplikasi
// ============================================================

require_once __DIR__ . '/config.php';

class Database
{
    private static ?PDO $instance = null;

    // Mencegah instansiasi langsung
    private function __construct() {}
    private function __clone() {}

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Di production, jangan tampilkan detail error ke user
                error_log('Database connection failed: ' . $e->getMessage());
                http_response_code(500);
                die(json_encode([
                    'success' => false,
                    'message' => 'Koneksi database gagal. Silakan coba lagi.'
                ]));
            }
        }

        return self::$instance;
    }
}
