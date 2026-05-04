<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';
require_once '../../helpers/session.php';

session_init();

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit();
}

$user = current_user();
$email = $user['email'];

try {
    $db = Database::getInstance();
    
    // Cari pesanan berdasarkan customer_email (Retroaktif)
    // Urutkan dari yang terbaru
    $query = "
        SELECT o.order_number, o.created_at, o.total_amount, o.status,
               (SELECT product_name_snapshot FROM order_items WHERE order_id = o.id LIMIT 1) as item_reg,
               (SELECT package_name FROM order_packages WHERE order_id = o.id LIMIT 1) as item_pkg
        FROM orders o
        WHERE o.customer_email = ?
        ORDER BY o.created_at DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "orders" => $orders
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
}
