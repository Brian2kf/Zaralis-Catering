<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../config/database.php';
require_once '../../helpers/session.php';

session_init();

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->first_name) || !isset($data->last_name)) {
    http_response_code(400);
    echo json_encode(["message" => "Data tidak lengkap"]);
    exit();
}

$user = current_user();
$userId = $user['id'];

try {
    $db = Database::getInstance();
    
    $query = "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([
        $data->first_name,
        $data->last_name,
        $data->phone ?? '',
        $userId
    ]);
    
    echo json_encode([
        "success" => true,
        "message" => "Profil berhasil diperbarui"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
