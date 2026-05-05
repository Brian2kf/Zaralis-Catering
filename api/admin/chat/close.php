<?php
// api/admin/chat/close.php
require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../helpers/session.php';
require_once __DIR__ . '/../../../config/Database.php';

header('Content-Type: application/json; charset=UTF-8');
session_init();

if (!is_admin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$session_id = intval($input['session_id'] ?? 0);

if ($session_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Session ID wajib diisi']);
    exit;
}

$db = Database::getInstance();

try {
    $upd = $db->prepare("UPDATE chat_sessions SET status = 'closed' WHERE id = ?");
    $upd->execute([$session_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Sesi berhasil ditutup'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
