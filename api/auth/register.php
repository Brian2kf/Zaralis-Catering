<?php
// ============================================================
// api/auth/register.php
// Endpoint: POST /api/auth/register.php
// ============================================================

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../models/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

header('Content-Type: application/json');
session_init();

// -------------------------------------------------------
// Ambil body JSON
// -------------------------------------------------------
$body       = json_decode(file_get_contents('php://input'), true);
$firstName  = trim($body['first_name'] ?? '');
$lastName   = trim($body['last_name']  ?? '');
$email      = trim($body['email']      ?? '');
$phone      = trim($body['phone']      ?? '');
$password   = $body['password']        ?? '';
$csrf       = $body['csrf_token']      ?? '';

// -------------------------------------------------------
// Validasi CSRF
// -------------------------------------------------------
if (!csrf_verify($csrf)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid. Muat ulang halaman.']);
    exit;
}

// -------------------------------------------------------
// Validasi input
// -------------------------------------------------------
$errors = [];

if (empty($firstName) || strlen($firstName) < 2) {
    $errors[] = 'Nama depan minimal 2 karakter.';
}
if (empty($lastName) || strlen($lastName) < 2) {
    $errors[] = 'Nama belakang minimal 2 karakter.';
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Format email tidak valid.';
}
if (empty($phone) || !preg_match('/^(\+62|62|0)[0-9]{8,13}$/', $phone)) {
    $errors[] = 'Format nomor telepon tidak valid. Contoh: 08123456789';
}
if (strlen($password) < 8) {
    $errors[] = 'Password minimal 8 karakter.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// -------------------------------------------------------
// Simpan ke database
// -------------------------------------------------------
$userModel = new User();
$newId     = $userModel->create([
    'first_name' => $firstName,
    'last_name'  => $lastName,
    'email'      => $email,
    'phone'      => $phone,
    'password'   => $password,
]);

// false berarti email sudah terdaftar
if ($newId === false) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
    ]);
    exit;
}

// -------------------------------------------------------
// Register berhasil — langsung login
// -------------------------------------------------------
$user = $userModel->findById($newId);
session_login($user);

echo json_encode([
    'success'  => true,
    'message'  => 'Akun berhasil dibuat! Mengalihkan...',
    'redirect' => APP_URL . '/index.php',
]);
