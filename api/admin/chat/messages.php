<?php
// api/admin/chat/messages.php
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

$session_id = intval($_GET['session_id'] ?? 0);
$last_id = intval($_GET['last_id'] ?? 0);

if ($session_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Session ID tidak valid']);
    exit;
}

$db = Database::getInstance();

try {
    $msgStmt = $db->prepare("SELECT * FROM chat_messages WHERE session_id = ? AND id > ? ORDER BY created_at ASC");
    $msgStmt->execute([$session_id, $last_id]);
    $messages = $msgStmt->fetchAll();
    
    // Mark customer messages as read when fetched by admin
    $customer_ids = array_filter($messages, fn($m) => $m['sender_type'] === 'customer' && $m['is_read'] == 0);
    if (!empty($customer_ids)) {
        $ids = array_column($customer_ids, 'id');
        $in  = str_repeat('?,', count($ids) - 1) . '?';
        $upd = $db->prepare("UPDATE chat_messages SET is_read = 1 WHERE id IN ($in)");
        $upd->execute($ids);
    }
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
