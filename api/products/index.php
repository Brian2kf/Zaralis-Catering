<?php
// Mengizinkan akses dari frontend dan mengatur format respons ke JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Memuat koneksi database
require_once '../../config/database.php';

// Mendapatkan koneksi database dari Singleton
$db = Database::getInstance();

// Query untuk mengambil produk aktif dan 1 gambar utamanya
$query = "
    SELECT p.id, p.name, p.description, p.price, p.category, p.created_at,
           (SELECT file_path FROM product_images pi 
            WHERE pi.product_id = p.id 
            ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image,
           (
               COALESCE((SELECT SUM(quantity) FROM order_items WHERE product_id = p.id), 0) +
               COALESCE((SELECT SUM(quantity) FROM order_package_items WHERE product_id = p.id), 0)
           ) as sold_count
    FROM products p
    WHERE p.is_active = 1
    ORDER BY p.category, p.name
";

$stmt = $db->prepare($query);
$stmt->execute();

// Menyiapkan wadah untuk hasil
$products = [
    "kue_satuan" => [],
    "paket_besar" => []
];

// Memasukkan data ke dalam array sesuai kategori
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $product_item = [
        "id" => $row['id'],
        "name" => $row['name'],
        "description" => $row['description'],
        "price" => $row['price'],
        "category" => $row['category'],
        "image" => $row['image'],
        "created_at" => $row['created_at'],
        "sold_count" => (int)$row['sold_count']
    ];

    if ($row['category'] == 'kue_satuan') {
        array_push($products["kue_satuan"], $product_item);
    } else {
        array_push($products["paket_besar"], $product_item);
    }
}

// Mengirimkan respons HTTP 200 OK dan data JSON
http_response_code(200);
echo json_encode($products);
?>