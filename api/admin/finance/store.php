<?php
// ============================================================
// api/admin/finance/store.php
// POST → Simpan transaksi finansial baru (Manual)
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

session_init();

// Cek autentikasi admin
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

try {
    $db = Database::getInstance();

    // Ambil data dari POST (FormData)
    $type            = $_POST['type'] ?? '';
    $category        = $_POST['category'] ?? '';
    $amount          = $_POST['amount'] ?? 0;
    $transactionDate = $_POST['transaction_date'] ?? date('Y-m-d');
    $description     = $_POST['description'] ?? '';
    $adminId         = $_SESSION['user_id'] ?? null;

    // ── Validasi Input ─────────────────────────────────────
    if (empty($type) || !in_array($type, ['income', 'expense'])) {
        throw new Exception('Tipe transaksi tidak valid.');
    }
    if (empty($category)) {
        throw new Exception('Kategori wajib dipilih.');
    }
    if ($amount <= 0) {
        throw new Exception('Nominal harus lebih besar dari 0.');
    }
    if (empty($transactionDate)) {
        throw new Exception('Tanggal transaksi wajib diisi.');
    }

    // ── Handle Upload Bukti (Opsional) ──────────────────────
    $receiptPath = null;
    if (isset($_FILES['receipt']) && $_FILES['receipt']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['receipt'];
        
        // Validasi tipe file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Format bukti transaksi harus Gambar atau PDF.');
        }

        // Buat nama file unik
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'trx_' . time() . '_' . uniqid() . '.' . $ext;
        $uploadPath = __DIR__ . '/../../../uploads/finance/' . $fileName;

        // Pastikan folder ada
        if (!is_dir(__DIR__ . '/../../../uploads/finance/')) {
            mkdir(__DIR__ . '/../../../uploads/finance/', 0777, true);
        }

        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            $receiptPath = 'uploads/finance/' . $fileName;
        }
    }

    // ── Simpan ke Database ──────────────────────────────────
    $stmt = $db->prepare("
        INSERT INTO financial_transactions (
            type, category, amount, description, transaction_date, receipt_path, created_by
        ) VALUES (
            :type, :category, :amount, :description, :transaction_date, :receipt_path, :created_by
        )
    ");

    $stmt->execute([
        ':type'             => $type,
        ':category'         => $category,
        ':amount'           => $amount,
        ':description'      => $description,
        ':transaction_date' => $transactionDate,
        ':receipt_path'     => $receiptPath,
        ':created_by'       => $adminId
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true, 
        'message' => 'Transaksi berhasil disimpan.',
        'id'      => $db->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
