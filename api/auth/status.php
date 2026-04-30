<?php
// ============================================================
// api/auth/status.php
// Endpoint: GET /api/auth/status.php
// Dipakai oleh load-components.js untuk cek status login
// dan mengisi data navbar secara dinamis
// ============================================================

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../helpers/session.php';

header('Content-Type: application/json');
session_init();

if (is_logged_in()) {
    $user = current_user();
    echo json_encode([
        'logged_in' => true,
        'name'      => $user['name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'avatar_url'=> 'https://ui-avatars.com/api/?name=' . urlencode($user['name'])
                       . '&background=2D6A4F&color=fff',
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
