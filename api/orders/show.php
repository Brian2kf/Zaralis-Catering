<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once '../../config/database.php';
require_once '../../helpers/session.php';

session_init();

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

if (!isset($_GET['order'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Nomor pesanan tidak diberikan."]);
    exit();
}

$order_number = $_GET['order'];
$user_id = $_SESSION['user_id'];

try {
    $db = Database::getInstance();
    
    // Pastikan order milik user yang login (berdasarkan user_id atau email)
    // Ambil email user yang login
    $stmtUser = $db->prepare("SELECT email FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $userEmail = $stmtUser->fetchColumn();

    $query = "SELECT * FROM orders WHERE order_number = ? AND (user_id = ? OR customer_email = ?)";
    $stmt = $db->prepare($query);
    $stmt->execute([$order_number, $user_id, $userEmail]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Pesanan tidak ditemukan atau bukan milik Anda."]);
        exit();
    }

    $order_id = $order['id'];

    $formattedItems = [];

    // Ambil Paket Besar (Regular items in order_items)
    $stmtRegular = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmtRegular->execute([$order_id]);
    $regularItems = $stmtRegular->fetchAll(PDO::FETCH_ASSOC);

    $formattedItems = [];
    $formattedRegularItems = [];

    foreach ($regularItems as $item) {
        $itemData = [
            'type' => 'paket_besar',
            'name' => $item['product_name_snapshot'],
            'product_name_snapshot' => $item['product_name_snapshot'],
            'price' => $item['product_price_snapshot'],
            'product_price_snapshot' => $item['product_price_snapshot'],
            'quantity' => $item['quantity'],
            'subtotal' => $item['subtotal']
        ];
        $formattedItems[] = $itemData;
        $formattedRegularItems[] = $itemData;
    }

    // Ambil Kue Satuan (Packages in order_packages)
    $stmtPackages = $db->prepare("SELECT * FROM order_packages WHERE order_id = ?");
    $stmtPackages->execute([$order_id]);
    $packageItems = $stmtPackages->fetchAll(PDO::FETCH_ASSOC);

    $formattedPackages = [];
    foreach ($packageItems as $pkg) {
        // Ambil item dalam paket
        $stmtPkgItems = $db->prepare("SELECT * FROM order_package_items WHERE order_package_id = ?");
        $stmtPkgItems->execute([$pkg['id']]);
        $pkgItems = $stmtPkgItems->fetchAll(PDO::FETCH_ASSOC);

        $pkgData = [
            'type' => 'kue_satuan',
            'name' => $pkg['package_name'],
            'package_name' => $pkg['package_name'],
            'price' => $pkg['package_price'],
            'package_price' => $pkg['package_price'],
            'quantity' => $pkg['quantity'],
            'subtotal' => $pkg['package_price'] * $pkg['quantity'],
            'items' => $pkgItems
        ];
        $formattedItems[] = $pkgData;
        $formattedPackages[] = $pkgData;
    }

    // Ambil bukti pembayaran jika ada
    $stmtPayment = $db->prepare("SELECT file_path, status, uploaded_at FROM payments WHERE order_id = ? ORDER BY uploaded_at DESC LIMIT 1");
    $stmtPayment->execute([$order_id]);
    $payment = $stmtPayment->fetch(PDO::FETCH_ASSOC);

    $response = [
        "status" => "success",
        "data" => [
            "id" => $order['id'],
            "order_number" => $order['order_number'],
            "status" => $order['status'],
            "total_amount" => $order['total_amount'],
            "shipping_cost" => $order['shipping_cost'] ?? 0,
            "created_at" => $order['created_at'],
            "customer_name" => $order['customer_name'],
            "customer_email" => $order['customer_email'],
            "customer_phone" => $order['customer_phone'],
            "delivery_address" => implode(', ', array_filter([
                $order['delivery_street'] . ($order['delivery_house_number'] ? ' ' . $order['delivery_house_number'] : ''),
                ($order['delivery_rt'] && $order['delivery_rw']) ? 'RT ' . $order['delivery_rt'] . '/RW ' . $order['delivery_rw'] : null,
                $order['delivery_kelurahan'],
                $order['delivery_kecamatan'],
                $order['delivery_postal_code'],
                $order['delivery_landmark'] ? '(Patokan: ' . $order['delivery_landmark'] . ')' : null,
            ])),
            "delivery_date" => $order['delivery_date'],
            "delivery_time" => $order['delivery_time'],
            "delivery_street" => $order['delivery_street'],
            "delivery_house_number" => $order['delivery_house_number'],
            "delivery_rt" => $order['delivery_rt'],
            "delivery_rw" => $order['delivery_rw'],
            "delivery_kelurahan" => $order['delivery_kelurahan'],
            "delivery_kecamatan" => $order['delivery_kecamatan'],
            "delivery_postal_code" => $order['delivery_postal_code'],
            "order_notes" => $order['order_notes'],
            "subtotal" => $order['subtotal'],
            "items" => $formattedItems,
            "packages" => $formattedPackages,
            "regular_items" => $formattedRegularItems,
            "payment_proof" => $payment['file_path'] ?? null,
            "payment" => $payment ? [
                "proof" => $payment['file_path'],
                "status" => $payment['status'],
                "date" => $payment['uploaded_at']
            ] : null
        ]
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
