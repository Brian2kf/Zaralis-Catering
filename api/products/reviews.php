<?php
// ============================================================
// api/products/reviews.php
// Mengelola review produk: GET (publik), POST & PUT (login)
// ============================================================

header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';
require_once '../../helpers/session.php';

session_init();

$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
// GET — Ambil review untuk suatu produk
// GET ?product_id=X&limit=5&offset=0     → daftar review publik
// GET ?product_id=X&order_id=Y           → cek review user untuk order tertentu
// ============================================================
if ($method === 'GET') {
    $product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;

    if (!$product_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'product_id tidak disertakan.']);
        exit;
    }

    // Mode: cek review spesifik per order (digunakan di modal pembelian)
    if (isset($_GET['order_id'])) {
        if (!is_logged_in()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Silakan login untuk melihat review Anda.']);
            exit;
        }
        $order_id = (int)$_GET['order_id'];
        $user_id  = (int)$_SESSION['user_id'];

        $stmt = $db->prepare(
            "SELECT id, rating, comment, created_at, updated_at
             FROM product_reviews
             WHERE product_id = ? AND order_id = ? AND user_id = ?
             LIMIT 1"
        );
        $stmt->execute([$product_id, $order_id, $user_id]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success'    => true,
            'has_review' => $review ? true : false,
            'review'     => $review ?: null
        ]);
        exit;
    }

    // Mode: daftar review publik (dengan pagination)
    $limit  = isset($_GET['limit'])  ? max(1, min(50, (int)$_GET['limit'])) : 5;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    // Total count untuk pagination "Lihat Semua"
    $stmt_count = $db->prepare("SELECT COUNT(id) as total FROM product_reviews WHERE product_id = ?");
    $stmt_count->execute([$product_id]);
    $total = (int)$stmt_count->fetch(PDO::FETCH_ASSOC)['total'];

    // Ambil review dengan nama reviewer
    $stmt = $db->prepare(
        "SELECT pr.id, pr.rating, pr.comment, pr.created_at,
                CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') as reviewer_name
         FROM product_reviews pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.product_id = ?
         ORDER BY pr.created_at DESC
         LIMIT ? OFFSET ?"
    );
    $stmt->execute([$product_id, $limit, $offset]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'  => true,
        'total'    => $total,
        'reviews'  => $reviews,
        'has_more' => ($offset + $limit) < $total
    ]);
    exit;
}

// ============================================================
// POST — Submit review baru
// Body JSON: { product_id, order_id, rating, comment }
// ============================================================
if ($method === 'POST') {
    if (!is_logged_in()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Silakan login untuk memberikan review.']);
        exit;
    }

    $data       = json_decode(file_get_contents('php://input'), true);
    $product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;
    $order_id   = isset($data['order_id'])   ? (int)$data['order_id']   : 0;
    $rating     = isset($data['rating'])     ? (int)$data['rating']     : 0;
    $comment    = isset($data['comment'])    ? trim($data['comment'])    : '';
    $user_id    = (int)$_SESSION['user_id'];

    // Validasi input dasar
    if (!$product_id || !$order_id || $rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak valid. Pastikan rating antara 1-5.']);
        exit;
    }

    // Validasi: user harus pernah membeli produk ini di order yang sudah completed
    // Cek berdasarkan user_id ATAU customer_email (untuk pesanan yang dilakukan sebagai guest)
    $user_email = $_SESSION['user_email'] ?? '';
    $stmt_check = $db->prepare(
        "SELECT o.id FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = ?
         LEFT JOIN order_packages op ON op.order_id = o.id
         LEFT JOIN order_package_items opi ON opi.order_package_id = op.id AND opi.product_id = ?
         WHERE o.id = ?
           AND (o.user_id = ? OR o.customer_email = ?)
           AND o.status = 'completed'
           AND (oi.id IS NOT NULL OR opi.id IS NOT NULL)
         LIMIT 1"
    );
    $stmt_check->execute([$product_id, $product_id, $order_id, $user_id, $user_email]);

    if ($stmt_check->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Anda tidak dapat me-review produk ini karena belum pernah membeli atau pesanan belum selesai.']);
        exit;
    }

    // Cek apakah sudah pernah review produk ini di order yang sama
    $stmt_exist = $db->prepare("SELECT id FROM product_reviews WHERE product_id = ? AND order_id = ? AND user_id = ? LIMIT 1");
    $stmt_exist->execute([$product_id, $order_id, $user_id]);
    if ($stmt_exist->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Anda sudah memberikan review untuk produk ini pada pesanan ini.']);
        exit;
    }

    // Simpan review
    $stmt_insert = $db->prepare(
        "INSERT INTO product_reviews (product_id, order_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt_insert->execute([$product_id, $order_id, $user_id, $rating, $comment ?: null]);

    echo json_encode(['success' => true, 'message' => 'Review berhasil dikirim. Terima kasih!']);
    exit;
}

// ============================================================
// PUT — Update review yang sudah ada
// Body JSON: { review_id, rating, comment }
// Hanya boleh jika order selesai < 7 hari lalu
// ============================================================
if ($method === 'PUT') {
    if (!is_logged_in()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Silakan login untuk mengubah review.']);
        exit;
    }

    $data      = json_decode(file_get_contents('php://input'), true);
    $review_id = isset($data['review_id']) ? (int)$data['review_id'] : 0;
    $rating    = isset($data['rating'])    ? (int)$data['rating']    : 0;
    $comment   = isset($data['comment'])   ? trim($data['comment'])  : '';
    $user_id   = (int)$_SESSION['user_id'];

    if (!$review_id || $rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak valid.']);
        exit;
    }

    // Ambil review + validasi kepemilikan + validasi 7 hari
    $stmt = $db->prepare(
        "SELECT pr.id, o.updated_at as order_completed_at
         FROM product_reviews pr
         JOIN orders o ON pr.order_id = o.id
         WHERE pr.id = ? AND pr.user_id = ? AND o.status = 'completed'
         LIMIT 1"
    );
    $stmt->execute([$review_id, $user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Review tidak ditemukan atau bukan milik Anda.']);
        exit;
    }

    // Cek batas waktu 7 hari dari tanggal order selesai
    $order_completed = new DateTime($row['order_completed_at']);
    $now             = new DateTime();
    $diff            = $now->diff($order_completed)->days;

    if ($diff > 7) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Batas waktu edit review (7 hari setelah pesanan selesai) telah berakhir.']);
        exit;
    }

    // Update review
    $stmt_update = $db->prepare("UPDATE product_reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?");
    $stmt_update->execute([$rating, $comment ?: null, $review_id, $user_id]);

    echo json_encode(['success' => true, 'message' => 'Review berhasil diperbarui.']);
    exit;
}

// Method tidak didukung
http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method tidak didukung.']);
