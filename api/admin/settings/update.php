<?php
// ============================================================
// api/admin/settings/update.php
// POST → Update pengaturan usaha
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_init();

// Hanya admin yang boleh akses
if (!is_admin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit;
}

$allowedKeys = [
    'business_name',
    'business_phone',
    'business_address',
    'bank_name',
    'bank_account',
    'bank_holder'
];

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    $stmt = $db->prepare("UPDATE business_settings SET setting_value = :val WHERE setting_key = :key");

    foreach ($allowedKeys as $key) {
        if (isset($input[$key])) {
            $stmt->bindValue(':val', trim($input[$key]));
            $stmt->bindValue(':key', $key);
            $stmt->execute();
        }
    }

    $db->commit();

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Pengaturan berhasil diperbarui.']);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Admin settings update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}
