<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';

// Mendapatkan koneksi database dari Singleton
$db = Database::getInstance();

// Menangkap ID produk dari URL (misal: show.php?id=1)
$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(["message" => "ID produk tidak disertakan."]);
    exit();
}

// Query untuk mengambil detail produk
$query_product = "SELECT id, name, description, price, category FROM products WHERE id = ? AND is_active = 1 LIMIT 1";
$stmt_product = $db->prepare($query_product);
$stmt_product->execute([$id]);

if ($stmt_product->rowCount() > 0) {
    $row = $stmt_product->fetch(PDO::FETCH_ASSOC);

    $product = [
        "id" => $row['id'],
        "name" => $row['name'],
        "description" => $row['description'],
        "price" => $row['price'],
        "category" => $row['category'],
        "images" => []
    ];

    // Query untuk mengambil semua gambar milik produk ini
    $query_images = "SELECT file_path, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC";
    $stmt_images = $db->prepare($query_images);
    $stmt_images->execute([$id]);

    while ($img_row = $stmt_images->fetch(PDO::FETCH_ASSOC)) {
        array_push($product["images"], $img_row);
    }

    http_response_code(200);
    echo json_encode($product);
} else {
    // Jika ID tidak ditemukan di database
    http_response_code(404);
    echo json_encode(["message" => "Produk tidak ditemukan."]);
}
?>