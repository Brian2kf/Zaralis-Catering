<?php
// api/chat/poll.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../config/Database.php';

header('Content-Type: application/json');
session_init();

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$session_token = $_GET['session_token'] ?? '';
$last_id = intval($_GET['last_id'] ?? 0);

if (empty($session_token)) {
    echo json_encode(['success' => false, 'message' => 'Token sesi wajib diisi']);
    exit;
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("SELECT id, status FROM chat_sessions WHERE session_token = ?");
    $stmt->execute([$session_token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Sesi tidak ditemukan']);
        exit;
    }
    
    $msgStmt = $db->prepare("SELECT * FROM chat_messages WHERE session_id = ? AND id > ? ORDER BY created_at ASC");
    $msgStmt->execute([$session['id'], $last_id]);
    $messages = $msgStmt->fetchAll();
    
    // Mark as read for admin messages if they are pulled by customer
    $admin_ids = array_filter($messages, fn($m) => $m['sender_type'] === 'admin' && $m['is_read'] == 0);
    if (!empty($admin_ids)) {
        $ids = array_column($admin_ids, 'id');
        $in  = str_repeat('?,', count($ids) - 1) . '?';
        $upd = $db->prepare("UPDATE chat_messages SET is_read = 1 WHERE id IN ($in)");
        $upd->execute($ids);
    }
    
    echo json_encode([
        'success' => true,
        'status' => $session['status'],
        'messages' => $messages
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
