<?php
// ============================================================
// api/auth/logout.php
// Endpoint: POST /api/auth/logout.php
// ============================================================

require_once __DIR__ . '/../../helpers/session.php';

session_init();
session_logout();

// Bisa dipanggil via fetch() (redirect di JS) atau langsung (redirect di PHP)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    echo json_encode([
        'success'  => true,
        'redirect' => APP_URL . '/login.php',
    ]);
} else {
    // Fallback jika dipanggil langsung via <a href>
    header('Location: ' . APP_URL . '/login.php');
}
exit;
