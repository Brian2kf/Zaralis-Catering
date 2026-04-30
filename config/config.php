<?php
// ============================================================
// Konfigurasi utama aplikasi 
// ============================================================

// --- Database ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'zaralis_catering');
define('DB_USER', 'root');       // default Laragon
define('DB_PASS', '');           // default Laragon kosong
define('DB_CHARSET', 'utf8mb4');

// --- Aplikasi ---
define('APP_NAME', "Zarali's Catering");
define('APP_URL', 'http://localhost/zaralis-catering'); // sesuaikan path Laragon Anda

// --- Session ---
define('SESSION_LIFETIME', 60 * 60 * 2); // 2 jam (detik)
define('SESSION_NAME', 'zaralis_sess');

// --- Upload ---
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5 MB
define('UPLOAD_ALLOWED', ['image/jpeg', 'image/png', 'image/jpg']);

// --- Timezone ---
date_default_timezone_set('Asia/Jakarta');

// --- Error reporting (matikan di production) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
