<?php
// ============================================================
// api/admin/products/show.php
// GET ?id=N  → Detail satu produk beserta semua gambarnya
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

session_init();

if (!is_admin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID produk tidak valid.']);
    exit;
}

try {
    $db = Database::getInstance();

    // Ambil data produk
    $stmt = $db->prepare(
        "SELECT id, name, description, price, category, is_active, created_at, updated_at
         FROM products WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan.']);
        exit;
    }

    // Cast tipe
    $product['id'] = (int) $product['id'];
    $product['price'] = (float) $product['price'];
    $product['is_active'] = (bool) $product['is_active'];

    // Ambil semua gambar
    $stmtImg = $db->prepare(
        "SELECT id, file_path, is_primary, sort_order
         FROM product_images
         WHERE product_id = ?
         ORDER BY is_primary DESC, sort_order ASC"
    );
    $stmtImg->execute([$id]);
    $images = $stmtImg->fetchAll();

    foreach ($images as &$img) {
        $img['id'] = (int) $img['id'];
        $img['is_primary'] = (bool) $img['is_primary'];
        $img['sort_order'] = (int) $img['sort_order'];
    }
    unset($img);

    $product['images'] = $images;

    http_response_code(200);
    echo json_encode(['success' => true, 'product' => $product], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Admin products show error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}