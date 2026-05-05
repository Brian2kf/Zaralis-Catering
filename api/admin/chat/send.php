<?php
// api/admin/chat/send.php
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
$message = trim($input['message'] ?? '');

if ($session_id <= 0 || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Session ID dan pesan wajib diisi']);
    exit;
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("SELECT id FROM chat_sessions WHERE id = ? AND status = 'active'");
    $stmt->execute([$session_id]);
    $session = $stmt->fetch();
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Sesi chat tidak valid atau sudah ditutup']);
        exit;
    }
    
    $admin_user_id = current_user()['id'];
    
    $ins = $db->prepare("INSERT INTO chat_messages (session_id, sender_type, sender_id, message) VALUES (?, 'admin', ?, ?)");
    $ins->execute([$session_id, $admin_user_id, $message]);
    
    echo json_encode([
        'success' => true,
        'message_id' => $db->lastInsertId(),
        'message' => 'Pesan berhasil dikirim'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
