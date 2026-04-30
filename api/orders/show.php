<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/database.php';

if (!isset($_GET['order'])) {
    http_response_code(400);
    echo json_encode(["message" => "Nomor pesanan tidak disertakan."]);
    exit();
}

$order_number = $_GET['order'];

try {
    $db = Database::getInstance();

    // 1. Ambil data utama Order
    $stmt = $db->prepare("SELECT * FROM orders WHERE order_number = ?");
    $stmt->execute([$order_number]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(["message" => "Pesanan tidak ditemukan."]);
        exit();
    }

    // 2. Ambil Paket Besar (Regular items)
    $stmtItems = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmtItems->execute([$order['id']]);
    $order['regular_items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    // 3. Ambil Paket Kue Satuan
    $stmtPkgs = $db->prepare("SELECT * FROM order_packages WHERE order_id = ?");
    $stmtPkgs->execute([$order['id']]);
    $packages = $stmtPkgs->fetchAll(PDO::FETCH_ASSOC);

    // Ambil detail item untuk setiap paket kue satuan
    foreach ($packages as &$pkg) {
        $stmtPkgItems = $db->prepare("SELECT * FROM order_package_items WHERE order_package_id = ?");
        $stmtPkgItems->execute([$pkg['id']]);
        $pkg['items'] = $stmtPkgItems->fetchAll(PDO::FETCH_ASSOC);
    }
    $order['packages'] = $packages;

    echo json_encode($order);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}
