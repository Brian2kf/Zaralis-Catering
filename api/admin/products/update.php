<?php
// ============================================================
// api/admin/products/update.php
// POST (multipart/form-data) → Edit produk
// Field  : id, name, description, price, category, is_active
// Arrays : deleted_image_ids[]
// Files  : new_images[] (maks sisa slot, JPG/PNG, maks 5 MB)
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
$id = (int) ($_POST['id'] ?? 0);
$name = trim($_POST['name'] ?? '');
$description = trim($_POST['description'] ?? '');
$price = (float) ($_POST['price'] ?? 0);
$category = trim($_POST['category'] ?? '');
$is_active = isset($_POST['is_active']) && $_POST['is_active'] === '1' ? 1 : 0;
$deletedImageIds = $_POST['deleted_image_ids'] ?? [];

$errors = [];
if ($id <= 0)
    $errors[] = 'ID produk tidak valid.';
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

    // ── Update Data Produk ─────────────────────────────────────
    $stmtUpdate = $db->prepare(
        "UPDATE products 
         SET name = :name, description = :description, price = :price, 
             category = :category, is_active = :is_active, updated_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );
    $stmtUpdate->execute([
        ':name' => $name,
        ':description' => $description,
        ':price' => $price,
        ':category' => $category,
        ':is_active' => $is_active,
        ':id' => $id,
    ]);

    // ── Hapus Gambar (jika ada) ────────────────────────────────
    if (!empty($deletedImageIds) && is_array($deletedImageIds)) {
        $placeholders = implode(',', array_fill(0, count($deletedImageIds), '?'));
        $stmtGetImages = $db->prepare("SELECT id, file_path FROM product_images WHERE product_id = ? AND id IN ($placeholders)");
        
        $params = [$id];
        foreach ($deletedImageIds as $imgId) {
            $params[] = (int) $imgId;
        }
        
        $stmtGetImages->execute($params);
        $imagesToDelete = $stmtGetImages->fetchAll();

        if (!empty($imagesToDelete)) {
            // Hapus file fisik
            foreach ($imagesToDelete as $img) {
                $fullPath = __DIR__ . '/../../../' . $img['file_path'];
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }

            // Hapus dari database
            $idsToDelete = array_column($imagesToDelete, 'id');
            $placeholdersDel = implode(',', array_fill(0, count($idsToDelete), '?'));
            $stmtDel = $db->prepare("DELETE FROM product_images WHERE id IN ($placeholdersDel)");
            $stmtDel->execute($idsToDelete);
        }
    }

    // ── Hitung Gambar yang Tersisa ─────────────────────────────
    $stmtCount = $db->prepare("SELECT COUNT(*) FROM product_images WHERE product_id = ?");
    $stmtCount->execute([$id]);
    $currentImageCount = (int) $stmtCount->fetchColumn();

    // ── Proses file gambar baru ────────────────────────────────
    $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    $maxSize = 5 * 1024 * 1024; // 5 MB
    $uploadDir = __DIR__ . '/../../../assets/images/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $uploadedFiles = [];

    if (!empty($_FILES['new_images']['name'][0])) {
        $fileCount = count($_FILES['new_images']['name']);
        
        // Batas maksimal gambar adalah 4
        if ($currentImageCount + $fileCount > 4) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Total foto melebihi batas maksimal 4 foto per produk.']);
            exit;
        }

        for ($i = 0; $i < $fileCount; $i++) {
            $tmpName = $_FILES['new_images']['tmp_name'][$i];
            $origName = $_FILES['new_images']['name'][$i];
            $size = $_FILES['new_images']['size'][$i];
            $error = $_FILES['new_images']['error'][$i];

            if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($tmpName))
                continue;
            if ($size > $maxSize) {
                $db->rollBack();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => "File {$origName} melebihi batas 5 MB."]);
                exit;
            }

            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpName);
            if (!in_array($mimeType, $allowedMimes)) {
                $db->rollBack();
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => "File {$origName}: format tidak didukung (JPG/PNG saja)."]);
                exit;
            }

            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            $newName = uniqid('prod_', true) . '.' . $ext;
            $destPath = $uploadDir . $newName;

            if (!move_uploaded_file($tmpName, $destPath)) {
                $db->rollBack();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server.']);
                exit;
            }

            // Jika belum ada gambar sama sekali, jadikan gambar pertama sebagai primary
            $isPrimary = ($currentImageCount === 0 && $i === 0) ? 1 : 0;
            
            $uploadedFiles[] = [
                'path' => 'assets/images/' . $newName,
                'is_primary' => $isPrimary,
                'sort_order' => $currentImageCount + $i,
            ];
        }
    }

    // Simpan gambar baru ke database
    if (!empty($uploadedFiles)) {
        $stmtImg = $db->prepare(
            "INSERT INTO product_images (product_id, file_path, is_primary, sort_order)
             VALUES (:product_id, :file_path, :is_primary, :sort_order)"
        );
        foreach ($uploadedFiles as $file) {
            $stmtImg->execute([
                ':product_id' => $id,
                ':file_path' => $file['path'],
                ':is_primary' => $file['is_primary'],
                ':sort_order' => $file['sort_order'],
            ]);
        }
    }

    // Pastikan minimal ada 1 gambar primary jika ada gambar
    $stmtCheckPrimary = $db->prepare("SELECT COUNT(*) FROM product_images WHERE product_id = ? AND is_primary = 1");
    $stmtCheckPrimary->execute([$id]);
    if ($stmtCheckPrimary->fetchColumn() == 0) {
        $stmtSetPrimary = $db->prepare("UPDATE product_images SET is_primary = 1 WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1");
        $stmtSetPrimary->execute([$id]);
    }

    $db->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Perubahan produk berhasil disimpan.'
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    // Hapus file yang sudah terupload jika DB gagal
    if (isset($uploadedFiles)) {
        foreach ($uploadedFiles as $file) {
            $fullPath = __DIR__ . '/../../../' . $file['path'];
            if (file_exists($fullPath))
                unlink($fullPath);
        }
    }
    error_log('Admin products update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}
