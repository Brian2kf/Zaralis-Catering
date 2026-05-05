<?php
// api/chat/init.php
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
$guest_name = trim($input['guest_name'] ?? '');

$db = Database::getInstance();

$user_id = null;
if (is_logged_in()) {
    $user_id = current_user()['id'];
}

try {
    // If a token is provided, try to find an existing active session
    if (!empty($session_token)) {
        $stmt = $db->prepare("SELECT * FROM chat_sessions WHERE session_token = ? AND status = 'active'");
        $stmt->execute([$session_token]);
        $session = $stmt->fetch();
        
        if ($session) {
            // Update user_id if they logged in after starting a guest session
            if ($user_id && !$session['user_id']) {
                $upd = $db->prepare("UPDATE chat_sessions SET user_id = ? WHERE id = ?");
                $upd->execute([$user_id, $session['id']]);
            }
            
            // Fetch messages
            $msgStmt = $db->prepare("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC");
            $msgStmt->execute([$session['id']]);
            $messages = $msgStmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'session_token' => $session_token,
                'messages' => $messages
            ]);
            exit;
        }
    }
    
    // If no active session found or no token provided, create a new one
    // Only if it's not empty guest name or user is logged in
    if (!$user_id && empty($guest_name)) {
        echo json_encode(['success' => false, 'message' => 'Nama diperlukan untuk pengunjung']);
        exit;
    }
    
    $new_token = bin2hex(random_bytes(32));
    $stmt = $db->prepare("INSERT INTO chat_sessions (session_token, user_id, guest_name) VALUES (?, ?, ?)");
    $stmt->execute([$new_token, $user_id, $guest_name]);
    $session_id = $db->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'session_token' => $new_token,
        'messages' => []
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
