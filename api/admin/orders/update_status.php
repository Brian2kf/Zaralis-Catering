<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../../config/database.php';
session_start();

$data = json_decode(file_get_contents("php://input"));

// Validasi input
if (!isset($data->order_number) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap."]);
    exit();
}

try {
    $db = Database::getInstance();

    // Mulai transaksi database
    $db->beginTransaction();

    // 1. Cari ID pesanan, status lamanya, dan total_amount
    $stmt = $db->prepare("SELECT id, user_id, customer_email, status, total_amount FROM orders WHERE order_number = ?");
    $stmt->execute([$data->order_number]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception("Pesanan tidak ditemukan.");
    }

    $order_id = $order['id'];
    $old_status = $order['status'];
    $new_status = $data->status;
    $total_amount = $order['total_amount'];

    if ($old_status === $new_status) {
        throw new Exception("Status pesanan ini sudah " . $new_status . ".");
    }

    // 2. Update status di tabel orders
    $stmtUpdate = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmtUpdate->execute([$new_status, $order_id]);

    // 3. Catat riwayat ke tabel order_status_logs
    $admin_name = isset($_SESSION['first_name']) ? $_SESSION['first_name'] : 'Admin';
    $notes = "Status diperbarui via Dashboard Admin";

    $stmtLog = $db->prepare("INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)");
    $stmtLog->execute([$order_id, $old_status, $new_status, $admin_name, $notes]);

    // 4. OTOMATISASI KEUANGAN: Catat pemasukan jika status menjadi 'processing' (pembayaran diverifikasi)
    if ($new_status === 'processing') {
        // Cek apakah sudah pernah dicatat (mencegah duplikasi)
        $stmtCheckFin = $db->prepare("SELECT id FROM financial_transactions WHERE order_id = ? AND type = 'income'");
        $stmtCheckFin->execute([$order_id]);
        if (!$stmtCheckFin->fetch()) {
            $desc = "Pembayaran Pesanan #" . $data->order_number;
            $stmtFin = $db->prepare("
                INSERT INTO financial_transactions (
                    order_id, type, category, amount, description, transaction_date, created_by
                ) VALUES (?, 'income', 'pesanan', ?, ?, CURDATE(), ?)
            ");
            $stmtFin->execute([$order_id, $total_amount, $desc, $admin_name]);
        }
    }

    // 5. OTOMATISASI KEUANGAN: Catat pengeluaran (Refund) jika status menjadi 'cancelled'
    if ($new_status === 'cancelled') {
        // Cek apakah sebelumnya sudah ada pemasukan (berarti uang sudah masuk)
        $stmtCheckIncome = $db->prepare("SELECT id FROM financial_transactions WHERE order_id = ? AND type = 'income'");
        $stmtCheckIncome->execute([$order_id]);
        
        if ($stmtCheckIncome->fetch()) {
            // Cek apakah sudah pernah direfund (mencegah duplikasi refund)
            $stmtCheckRefund = $db->prepare("SELECT id FROM financial_transactions WHERE order_id = ? AND type = 'expense'");
            $stmtCheckRefund->execute([$order_id]);

            if (!$stmtCheckRefund->fetch()) {
                $desc = "Refund Pesanan Batal #" . $data->order_number;
                $stmtRefund = $db->prepare("
                    INSERT INTO financial_transactions (
                        order_id, type, category, amount, description, transaction_date, created_by
                    ) VALUES (?, 'expense', 'lainnya', ?, ?, CURDATE(), ?)
                ");
                $stmtRefund->execute([$order_id, $total_amount, $desc, $admin_name]);
            }
        }
    }

    // 6. BUAT NOTIFIKASI PELANGGAN
    $target_user_id = $order['user_id'];
    if (empty($target_user_id)) {
        // Coba cari user_id dari tabel users berdasarkan email pesanan
        $stmtUser = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmtUser->execute([$order['customer_email']]);
        $target_user_id = $stmtUser->fetchColumn();
    }

    if (!empty($target_user_id)) {
        $statusNames = [
            'pending_payment' => 'Belum Bayar',
            'pending_verification' => 'Menunggu Verifikasi',
            'processing' => 'Sedang Diproses',
            'shipped' => 'Sedang Dikirim',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan'
        ];
        $statusName = $statusNames[$new_status] ?? $new_status;
        $title = "Update Pesanan #" . $data->order_number;
        $message = "Status pesanan Anda telah berubah menjadi: " . $statusName;

        $stmtNotif = $db->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
        $stmtNotif->execute([$target_user_id, $title, $message]);
    }

    // Simpan semua perubahan
    $db->commit();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Status berhasil diperbarui."]);

} catch (Exception $e) {
    // Batalkan jika ada error
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>