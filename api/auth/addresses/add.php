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
if (!$data) {
    http_response_code(400);
    echo json_encode(["message" => "Data tidak valid"]);
    exit();
}

$user = current_user();
$userId = $user['id'];

try {
    $db = Database::getInstance();
    
    // Cek jumlah alamat
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM addresses WHERE user_id = ?");
    $stmtCount->execute([$userId]);
    if ($stmtCount->fetchColumn() >= 3) {
        throw new Exception("Maksimal simpan 3 alamat.");
    }

    // Jika ini alamat pertama, set sebagai utama
    $stmtFirst = $db->prepare("SELECT COUNT(*) FROM addresses WHERE user_id = ?");
    $stmtFirst->execute([$userId]);
    $isFirst = $stmtFirst->fetchColumn() == 0;

    $query = "INSERT INTO addresses (
        user_id, street_name, house_number, rt, rw, kelurahan, kecamatan, postal_code, landmark, is_main
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        $userId,
        $data->street_name,
        $data->house_number,
        $data->rt ?? '',
        $data->rw ?? '',
        $data->kelurahan,
        $data->kecamatan,
        $data->postal_code ?? '',
        $data->landmark ?? '',
        $isFirst ? 1 : 0
    ]);
    
    echo json_encode([
        "success" => true,
        "message" => "Alamat berhasil ditambahkan"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => $e->getMessage()]);
}
