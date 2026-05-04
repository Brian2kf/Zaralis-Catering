<?php
// ============================================================
// api/admin/products/store.php
// POST (multipart/form-data) → Tambah produk baru
// Field  : name, description, price, category, is_active
// Files  : images[] (maks 4, JPG/PNG, maks 5 MB per file)
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

// ── Validasi input teks ────────────────────────────────────
$name = trim($_POST['name'] ?? '');
$description = trim($_POST['description'] ?? '');
$price = (float) ($_POST['price'] ?? 0);
$category = trim($_POST['category'] ?? '');
$is_active = isset($_POST['is_active']) && $_POST['is_active'] === '1' ? 1 : 0;

$errors = [];
if ($name === '')
    $errors[] = 'Nama produk wajib diisi.';
if (strlen($name) > 255)
    $errors[] = 'Nama produk maksimal 255 karakter.';
if ($price <= 0)
    $errors[] = 'Harga harus lebih dari 0.';
if (!in_array($category, ['kue_satuan', 'paket_besar']))
    $errors[] = 'Kategori tidak valid.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Proses file gambar ─────────────────────────────────────
$allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
$maxSize = 5 * 1024 * 1024; // 5 MB
$uploadDir = __DIR__ . '/../../../assets/images/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uploadedFiles = [];

if (!empty($_FILES['images']['name'][0])) {
    $fileCount = count($_FILES['images']['name']);

    if ($fileCount > 4) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Maksimal 4 foto produk.']);
        exit;
    }

    for ($i = 0; $i < $fileCount; $i++) {
        $tmpName = $_FILES['images']['tmp_name'][$i];
        $origName = $_FILES['images']['name'][$i];
        $size = $_FILES['images']['size'][$i];
        $error = $_FILES['images']['error'][$i];

        if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($tmpName))
            continue;
        if ($size > $maxSize) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => "File {$origName} melebihi batas 5 MB."]);
            exit;
        }

        // Validasi MIME type nyata (bukan hanya ekstensi)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tmpName);
        if (!in_array($mimeType, $allowedMimes)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => "File {$origName}: format tidak didukung (JPG/PNG saja)."]);
            exit;
        }

        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $newName = uniqid('prod_', true) . '.' . $ext;
        $destPath = $uploadDir . $newName;

        if (!move_uploaded_file($tmpName, $destPath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server.']);
            exit;
        }

        $uploadedFiles[] = [
            'path' => 'assets/images/' . $newName,
            'is_primary' => ($i === 0) ? 1 : 0,

            'sort_order' => $i,
        ];
    }
}

// ── Simpan ke database ─────────────────────────────────────
try {
    $db = Database::getInstance();
    $db->beginTransaction();

    $stmt = $db->prepare(
        "INSERT INTO products (name, description, price, category, is_active)
         VALUES (:name, :description, :price, :category, :is_active)"
    );
    $stmt->execute([
        ':name' => $name,
        ':description' => $description,
        ':price' => $price,
        ':category' => $category,
        ':is_active' => $is_active,
    ]);
    $newProductId = (int) $db->lastInsertId();

    // Simpan gambar
    if (!empty($uploadedFiles)) {
        $stmtImg = $db->prepare(
            "INSERT INTO product_images (product_id, file_path, is_primary, sort_order)
             VALUES (:product_id, :file_path, :is_primary, :sort_order)"
        );
        foreach ($uploadedFiles as $file) {
            $stmtImg->execute([
                ':product_id' => $newProductId,
                ':file_path' => $file['path'],
                ':is_primary' => $file['is_primary'],
                ':sort_order' => $file['sort_order'],
            ]);
        }
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil ditambahkan.',
        'product_id' => $newProductId,
    ]);

} catch (Exception $e) {
    $db->rollBack();
    // Hapus file yang sudah terupload jika DB gagal
    foreach ($uploadedFiles as $file) {
        $fullPath = __DIR__ . '/../../../../' . $file['path'];
        if (file_exists($fullPath))
            unlink($fullPath);
    }
    error_log('Admin products store error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}