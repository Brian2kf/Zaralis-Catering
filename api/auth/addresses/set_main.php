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
    $db->beginTransaction();

    // 1. Reset semua alamat user ini menjadi bukan utama
    $stmtReset = $db->prepare("UPDATE addresses SET is_main = 0 WHERE user_id = ?");
    $stmtReset->execute([$userId]);

    // 2. Set alamat yang dipilih menjadi utama
    $stmtSet = $db->prepare("UPDATE addresses SET is_main = 1 WHERE id = ? AND user_id = ?");
    $stmtSet->execute([$data->id, $userId]);

    $db->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Alamat utama berhasil diperbarui"
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["message" => $e->getMessage()]);
}
