<?php
// api/chat/send.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../helpers/session.php';
require_once __DIR__ . '/../../config/Database.php';

header('Content-Type: application/json');
session_init();

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$session_token = $input['session_token'] ?? '';
$message = trim($input['message'] ?? '');

if (empty($session_token) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Token sesi dan pesan wajib diisi']);
    exit;
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("SELECT id, user_id FROM chat_sessions WHERE session_token = ? AND status = 'active'");
    $stmt->execute([$session_token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        echo json_encode(['success' => false, 'message' => 'Sesi chat tidak valid atau sudah ditutup']);
        exit;
    }
    
    // Sender ID is null if guest, else user_id
    $sender_id = $session['user_id'];
    
    $ins = $db->prepare("INSERT INTO chat_messages (session_id, sender_type, sender_id, message) VALUES (?, 'customer', ?, ?)");
    $ins->execute([$session['id'], $sender_id, $message]);
    
    echo json_encode([
        'success' => true,
        'message_id' => $db->lastInsertId(),
        'message' => 'Pesan berhasil dikirim'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
