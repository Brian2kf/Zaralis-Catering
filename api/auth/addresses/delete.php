<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../../config/database.php';
require_once '../../../helpers/session.php';

session_init();

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->id)) {
    http_response_code(400);
    echo json_encode(["message" => "ID tidak valid"]);
    exit();
}

$user = current_user();
$userId = $user['id'];

try {
    $db = Database::getInstance();
    
    // Cek apakah yang dihapus adalah alamat utama
    $stmtCheck = $db->prepare("SELECT is_main FROM addresses WHERE id = ? AND user_id = ?");
    $stmtCheck->execute([$data->id, $userId]);
    $isMain = $stmtCheck->fetchColumn();

    $stmt = $db->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?");
    $stmt->execute([$data->id, $userId]);

    // Jika yang dihapus adalah utama, set alamat lain (jika ada) jadi utama
    if ($isMain) {
        $stmtNext = $db->prepare("SELECT id FROM addresses WHERE user_id = ? LIMIT 1");
        $stmtNext->execute([$userId]);
        $nextId = $stmtNext->fetchColumn();
        if ($nextId) {
            $stmtSet = $db->prepare("UPDATE addresses SET is_main = 1 WHERE id = ?");
            $stmtSet->execute([$nextId]);
        }
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Alamat berhasil dihapus"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => $e->getMessage()]);
}
