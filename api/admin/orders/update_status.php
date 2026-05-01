<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../../config/database.php';
session_start();

$data = json_decode(file_get_contents("php://input"));

// Validasi input
if (!isset($data->order_number) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap."]);
    exit();
}

try {
    $db = Database::getInstance();

    // Mulai transaksi database
    $db->beginTransaction();

    // 1. Cari ID pesanan dan status lamanya
    $stmt = $db->prepare("SELECT id, status FROM orders WHERE order_number = ?");
    $stmt->execute([$data->order_number]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception("Pesanan tidak ditemukan.");
    }

    $order_id = $order['id'];
    $old_status = $order['status'];
    $new_status = $data->status;

    if ($old_status === $new_status) {
        throw new Exception("Status pesanan ini sudah " . $new_status . ".");
    }

    // 2. Update status di tabel orders
    $stmtUpdate = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmtUpdate->execute([$new_status, $order_id]);

    // 3. Catat riwayat ke tabel order_status_logs
    $admin_name = isset($_SESSION['first_name']) ? $_SESSION['first_name'] : 'Admin';
    $notes = "Status diperbarui via Dashboard Admin";

    $stmtLog = $db->prepare("INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)");
    $stmtLog->execute([$order_id, $old_status, $new_status, $admin_name, $notes]);

    // Simpan semua perubahan
    $db->commit();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Status berhasil diperbarui."]);

} catch (Exception $e) {
    // Batalkan jika ada error
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>