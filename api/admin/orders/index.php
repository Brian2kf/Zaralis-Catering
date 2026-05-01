<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Sesuaikan path jika direktori config berbeda
require_once '../../../config/database.php';

try {
    $db = Database::getInstance();

    // 1. Ambil Data Statistik
    $stats = [
        'total' => 0,
        'menunggu_verifikasi' => 0,
        'diproses' => 0,
        'selesai_hari_ini' => 0
    ];

    // Total Semua Pesanan
    $stmt = $db->query("SELECT COUNT(*) FROM orders");
    $stats['total'] = $stmt->fetchColumn();

    // Menunggu Verifikasi
    $stmt = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'pending_verification'");
    $stats['menunggu_verifikasi'] = $stmt->fetchColumn();

    // Pesanan Diproses
    $stmt = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'processing'");
    $stats['diproses'] = $stmt->fetchColumn();

    // Selesai Hari Ini
    $stmt = $db->query("SELECT COUNT(*) FROM orders WHERE status = 'completed' AND DATE(updated_at) = CURDATE()");
    $stats['selesai_hari_ini'] = $stmt->fetchColumn();

    // 2. Ambil Daftar Pesanan (Urut dari yang terbaru)
    $query = "SELECT order_number, customer_name, total_amount, status, created_at FROM orders ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => [
            'stats' => $stats,
            'orders' => $orders
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>