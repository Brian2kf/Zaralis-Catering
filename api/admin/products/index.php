<?php
// ============================================================
// api/admin/products/index.php
// GET  → Daftar semua produk + stats untuk halaman menu admin
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

session_init();

// Hanya admin yang boleh akses
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

try {
    $db = Database::getInstance();

    // ── 1. Stats Overview ──────────────────────────────────────

    // Total produk aktif
    $stmtTotal = $db->query(
        "SELECT COUNT(*) FROM products WHERE is_active = 1"
    );
    $totalActive = (int) $stmtTotal->fetchColumn();

    // Total semua produk (aktif + nonaktif)
    $stmtAll = $db->query("SELECT COUNT(*) FROM products");
    $totalAll = (int) $stmtAll->fetchColumn();

    // Menu terlaris — produk yang paling sering muncul di order_items + order_package_items
    // Gabungkan dari kedua tabel, lalu cari yang terbanyak
    $stmtBest = $db->query("
        SELECT p.name, COUNT_combined AS total_ordered
        FROM (
            SELECT product_id, SUM(qty) AS COUNT_combined
            FROM (
                SELECT product_id, SUM(quantity) AS qty
                FROM order_items
                WHERE product_id IS NOT NULL
                GROUP BY product_id

                UNION ALL

                SELECT product_id, SUM(quantity) AS qty
                FROM order_package_items
                WHERE product_id IS NOT NULL
                GROUP BY product_id
            ) AS combined
            GROUP BY product_id
        ) AS summary
        JOIN products p ON p.id = summary.product_id
        ORDER BY total_ordered DESC
        LIMIT 1
    ");
    $bestSeller = $stmtBest->fetch();

    // Produk yang terakhir diperbarui
    $stmtLastUpdate = $db->query(
        "SELECT updated_at FROM products ORDER BY updated_at DESC LIMIT 1"
    );
    $lastUpdated = $stmtLastUpdate->fetchColumn();

    // ── 2. Daftar Produk (dengan gambar utama) ─────────────────

    // Support filter, search, pagination
    $page     = max(1, (int) ($_GET['page']     ?? 1));
    $perPage  = max(1, min(50, (int) ($_GET['per_page'] ?? 10)));
    $search   = trim($_GET['search']   ?? '');
    $category = trim($_GET['category'] ?? '');
    $offset   = ($page - 1) * $perPage;

    // Bangun kondisi WHERE
    $conditions = [];
    $params     = [];

    if ($search !== '') {
        $conditions[] = 'p.name LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }

    if ($category !== '') {
        $conditions[] = 'p.category = :category';
        $params[':category'] = $category;
    }

    $where = count($conditions) > 0
        ? 'WHERE ' . implode(' AND ', $conditions)
        : '';

    // Total rows untuk pagination
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM products p $where");
    $stmtCount->execute($params);
    $totalRows = (int) $stmtCount->fetchColumn();

    // Ambil data produk
    $stmtProducts = $db->prepare("
        SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            p.category,
            p.is_active,
            p.created_at,
            p.updated_at,
            (
                SELECT pi.file_path
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC, pi.sort_order ASC
                LIMIT 1
            ) AS image
        FROM products p
        $where
        ORDER BY p.category ASC, p.name ASC
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $key => $val) {
        $stmtProducts->bindValue($key, $val);
    }
    $stmtProducts->bindValue(':limit',  $perPage, PDO::PARAM_INT);
    $stmtProducts->bindValue(':offset', $offset,  PDO::PARAM_INT);
    $stmtProducts->execute();
    $products = $stmtProducts->fetchAll();

    // Cast tipe data
    foreach ($products as &$p) {
        $p['id']        = (int)    $p['id'];
        $p['price']     = (float)  $p['price'];
        $p['is_active'] = (bool)   $p['is_active'];
    }
    unset($p);

    // ── 3. Response ────────────────────────────────────────────
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'stats'   => [
            'total_active'   => $totalActive,
            'total_all'      => $totalAll,
            'best_seller'    => $bestSeller ? $bestSeller['name'] : '-',
            'last_updated'   => $lastUpdated ?: null,
        ],
        'pagination' => [
            'page'        => $page,
            'per_page'    => $perPage,
            'total_rows'  => $totalRows,
            'total_pages' => (int) ceil($totalRows / $perPage),
        ],
        'products' => $products,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Admin products index error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}