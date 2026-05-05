<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../config/database.php';
require_once '../../helpers/session.php';

session_init();

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

$user = current_user();
$userId = $user['id'];

try {
    $db = Database::getInstance();
    
    $query = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";
    $stmt = $db->prepare($query);
    $stmt->execute([$userId]);
    
    echo json_encode([
        "success" => true,
        "message" => "All notifications marked as read."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
}
