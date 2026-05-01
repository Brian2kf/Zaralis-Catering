<?php
// ============================================================
// api/auth/login.php
// Endpoint: POST /api/auth/login.php
// Dipanggil via fetch() dari login.php (halaman HTML/PHP)
// ============================================================

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../models/User.php';

// Pastikan hanya menerima POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

header('Content-Type: application/json');
session_init();

// -------------------------------------------------------
// Ambil & decode body JSON dari fetch()
// -------------------------------------------------------
$body = json_decode(file_get_contents('php://input'), true);
$email = trim($body['email'] ?? '');
$pass = $body['password'] ?? '';
$csrf = $body['csrf_token'] ?? '';

// -------------------------------------------------------
// Validasi CSRF
// -------------------------------------------------------
if (!csrf_verify($csrf)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid. Muat ulang halaman.']);
    exit;
}

// -------------------------------------------------------
// Validasi input dasar
// -------------------------------------------------------
$errors = [];

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Format email tidak valid.';
}
if (empty($pass)) {
    $errors[] = 'Password wajib diisi.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// -------------------------------------------------------
// Cek user di database
// -------------------------------------------------------
$userModel = new User();
$user = $userModel->findByEmail($email);

// Gunakan pesan generik agar tidak bocorkan info apakah email terdaftar
if (!$user || !$userModel->verifyPassword($pass, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Email atau password salah.']);
    exit;
}

// -------------------------------------------------------
// Login berhasil — simpan ke session
// -------------------------------------------------------
session_login($user);

// Tentukan redirect berdasarkan role
$redirect = ($user['role'] === 'admin')
    ? APP_URL . '/admin/index.html'
    : APP_URL . '/index.html';

echo json_encode([
    'success' => true,
    'message' => 'Login berhasil! Mengalihkan...',
    'redirect' => $redirect,
    'user' => [
        'name' => $user['first_name'] . ' ' . $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
]);
