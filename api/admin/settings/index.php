<?php
// ============================================================
// api/admin/settings/index.php
// GET  → Ambil pengaturan usaha
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

session_init();

// Hanya admin yang boleh akses
if (!is_admin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT setting_key, setting_value FROM business_settings");
    $settingsRaw = $stmt->fetchAll();

    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $settings
    ]);

} catch (Exception $e) {
    error_log('Admin settings index error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}
