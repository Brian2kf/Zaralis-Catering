<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../config/database.php';

// Mendapatkan koneksi database
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Koneksi database gagal."]);
    exit();
}

// Validasi keberadaan input POST (multipart/form-data)
if (!isset($_POST['order_number']) || !isset($_FILES['receipt'])) {
    http_response_code(400);
    echo json_encode(["message" => "Nomor pesanan dan file bukti pembayaran wajib diisi."]);
    exit();
}

$order_number = $_POST['order_number'];
$file = $_FILES['receipt'];

try {
    // Memulai transaksi database
    $db->beginTransaction();

    // 1. Cek validitas pesanan
    $stmt = $db->prepare("SELECT id FROM orders WHERE order_number = ? AND status = 'pending_payment' LIMIT 1");
    $stmt->execute([$order_number]);
    $order_id = $stmt->fetchColumn();

    if (!$order_id) {
        throw new Exception("Pesanan tidak ditemukan atau pembayaran sudah diproses sebelumnya.");
    }

    // 2. Validasi File Upload
    $allowed_types = ['image/jpeg', 'image/png', 'image/jpg'];
    $max_size = 5 * 1024 * 1024; // Maksimal 5MB

    if (!in_array($file['type'], $allowed_types)) {
        throw new Exception("Format file tidak valid. Harap unggah gambar berformat JPG atau PNG.");
    }

    if ($file['size'] > $max_size) {
        throw new Exception("Ukuran file terlalu besar. Maksimal 5MB.");
    }

    // 3. Proses Upload File
    $upload_dir = '../../uploads/payments/';

    // Buat folder jika belum ada
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    // Generate nama file unik
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $new_filename = $order_number . '_' . time() . '.' . $file_extension;
    $target_path = $upload_dir . $new_filename;

    // Path relatif yang akan disimpan ke database
    $db_path = 'uploads/payments/' . $new_filename;

    // Pindahkan file dari temporary directory ke folder tujuan
    if (!move_uploaded_file($file['tmp_name'], $target_path)) {
        throw new Exception("Gagal menyimpan file ke server. Periksa hak akses folder.");
    }

    // 4. Simpan data bukti bayar ke tabel payments
    $stmtPayment = $db->prepare("INSERT INTO payments (order_id, file_path, status) VALUES (?, ?, 'uploaded')");
    $stmtPayment->execute([$order_id, $db_path]);

    // 5. Update status pesanan di tabel orders
    $stmtUpdateOrder = $db->prepare("UPDATE orders SET status = 'pending_verification' WHERE id = ?");
    $stmtUpdateOrder->execute([$order_id]);

    // 6. Catat log perubahan status ke order_status_logs
    $stmtLog = $db->prepare("INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, notes) VALUES (?, 'pending_payment', 'pending_verification', 'system', 'Pelanggan mengunggah bukti pembayaran')");
    $stmtLog->execute([$order_id]);

    // Selesaikan transaksi
    $db->commit();

    http_response_code(200);
    echo json_encode(["message" => "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin."]);

} catch (Exception $e) {
    // Batalkan seluruh proses database jika ada kegagalan
    $db->rollBack();

    // Hapus file yang terlanjur terunggah jika transaksi database gagal
    if (isset($target_path) && file_exists($target_path)) {
        unlink($target_path);
    }

    http_response_code(400);
    echo json_encode(["message" => $e->getMessage()]);
}
?>