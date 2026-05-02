<?php
// ============================================================
// api/admin/products/destroy.php
// POST (JSON) → Hapus produk beserta gambarnya
// Field: id
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Ambil input JSON
$input = json_decode(file_get_contents('php://input'), true);
$id = (int) ($input['id'] ?? 0);

if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'ID produk tidak valid.']);
    exit;
}

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    // Pastikan produk ada
    $stmtCheck = $db->prepare("SELECT id FROM products WHERE id = ?");
    $stmtCheck->execute([$id]);
    if (!$stmtCheck->fetch()) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan.']);
        exit;
    }

    // ── Ambil Gambar Produk ─────────────────────────────────────
    $stmtGetImages = $db->prepare("SELECT file_path FROM product_images WHERE product_id = ?");
    $stmtGetImages->execute([$id]);
    $imagesToDelete = $stmtGetImages->fetchAll();

    // Hapus file fisik gambar
    if (!empty($imagesToDelete)) {
        foreach ($imagesToDelete as $img) {
            $fullPath = __DIR__ . '/../../../../' . $img['file_path'];
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
        }
        
        // Hapus data gambar dari tabel product_images
        $stmtDelImg = $db->prepare("DELETE FROM product_images WHERE product_id = ?");
        $stmtDelImg->execute([$id]);
    }

    // ── Hapus Produk ────────────────────────────────────────────
    $stmtDelProduct = $db->prepare("DELETE FROM products WHERE id = ?");
    $stmtDelProduct->execute([$id]);

    $db->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil dihapus secara permanen.'
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    error_log('Admin products destroy error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server saat menghapus produk.']);
}
