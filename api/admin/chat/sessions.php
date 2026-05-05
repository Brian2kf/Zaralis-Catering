<?php
// api/admin/chat/sessions.php
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

$db = Database::getInstance();

try {
    // Get all active sessions with the latest message and unread count
    $sql = "
        SELECT 
            cs.id, 
            cs.session_token, 
            cs.status,
            COALESCE(u.first_name, cs.guest_name, 'Guest') as customer_name,
            u.email as customer_email,
            cs.created_at,
            (SELECT message FROM chat_messages cm WHERE cm.session_id = cs.id ORDER BY cm.created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM chat_messages cm WHERE cm.session_id = cs.id ORDER BY cm.created_at DESC LIMIT 1) as last_message_time,
            (SELECT COUNT(*) FROM chat_messages cm WHERE cm.session_id = cs.id AND cm.sender_type = 'customer' AND cm.is_read = 0) as unread_count
        FROM chat_sessions cs
        LEFT JOIN users u ON cs.user_id = u.id
        WHERE cs.status = 'active'
        ORDER BY last_message_time DESC, cs.created_at DESC
    ";
    
    $stmt = $db->query($sql);
    $sessions = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'sessions' => $sessions
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
