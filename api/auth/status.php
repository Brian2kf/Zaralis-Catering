<?php
// ============================================================
// api/auth/status.php
// Endpoint: GET /api/auth/status.php
// Dipakai oleh load-components.js untuk cek status login
// dan mengisi data navbar secara dinamis
// ============================================================

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../models/User.php';

header('Content-Type: application/json');
session_init();

if (is_logged_in()) {
    $sessionUser = current_user();
    $userModel = new User();
    $user = $userModel->findById($sessionUser['id']);
    
    if ($user) {
        echo json_encode([
            'logged_in' => true,
            'id'         => $user['id'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'name'       => $user['first_name'] . ' ' . $user['last_name'],
            'email'      => $user['email'],
            'phone'      => $user['phone'],
            'role'       => strtolower($user['role']),
            'avatar_url' => 'https://ui-avatars.com/api/?name=' . urlencode($user['first_name'] . ' ' . $user['last_name'])
                           . '&background=2D6A4F&color=fff',
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
} else {
    echo json_encode(['logged_in' => false]);
}
