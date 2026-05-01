<?php
// ============================================================
// api/orders/track.php
// Public endpoint — Cek status pesanan via nomor order + email/HP
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Cache-Control: no-cache, no-store, must-revalidate");

require_once '../../config/database.php';

// ─────────────────────────────────────────────
// 1. Validasi Input
// ─────────────────────────────────────────────
$order_number = isset($_GET['order_number']) ? trim($_GET['order_number']) : '';
$identifier   = isset($_GET['identifier'])   ? trim($_GET['identifier'])   : '';

if ($order_number === '' || $identifier === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Nomor pesanan dan email/nomor HP wajib diisi.'
    ]);
    exit();
}

// ─────────────────────────────────────────────
// 2. Koneksi DB
// ─────────────────────────────────────────────
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal.']);
    exit();
}

// ─────────────────────────────────────────────
// 3. Cari Pesanan Berdasarkan Nomor Order
// ─────────────────────────────────────────────
try {
    $stmtOrder = $db->prepare("
        SELECT
            id, order_number, customer_name, customer_email, customer_phone,
            status, subtotal, shipping_cost, total_amount, shipping_distance_km,
            delivery_street, delivery_house_number, delivery_rt, delivery_rw,
            delivery_kelurahan, delivery_kecamatan, delivery_postal_code, delivery_landmark,
            delivery_date, delivery_time, order_notes, created_at
        FROM orders
        WHERE order_number = ?
        LIMIT 1
    ");
    $stmtOrder->execute([$order_number]);
    $order = $stmtOrder->fetch(PDO::FETCH_ASSOC);

    // 404 — Nomor pesanan tidak ditemukan
    if (!$order) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Nomor pesanan tidak ditemukan. Periksa kembali nomor order Anda.'
        ]);
        exit();
    }

    // ─────────────────────────────────────────────
    // 4. Verifikasi Identitas (Email ATAU Telepon)
    // ─────────────────────────────────────────────
    $identifier_clean   = strtolower(preg_replace('/\s+/', '', $identifier));
    $email_clean        = strtolower(preg_replace('/\s+/', '', $order['customer_email']));
    $phone_clean        = preg_replace('/\s+/', '', $order['customer_phone']);

    // Normalisasi nomor HP: hapus +62 / 62 di depan, ganti jadi 0
    $normalizePhone = function ($phone) {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (substr($phone, 0, 2) === '62') {
            $phone = '0' . substr($phone, 2);
        }
        return $phone;
    };

    $identifier_norm = $normalizePhone($identifier_clean);
    $phone_norm      = $normalizePhone($phone_clean);

    $emailMatch = ($identifier_clean === $email_clean);
    $phoneMatch = ($identifier_norm  === $phone_norm) && (strlen($identifier_norm) >= 8);

    if (!$emailMatch && !$phoneMatch) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Email atau nomor HP tidak cocok dengan pesanan ini.'
        ]);
        exit();
    }

    $order_id = $order['id'];

    // ─────────────────────────────────────────────
    // 5. Ambil Timeline dari order_status_logs
    // ─────────────────────────────────────────────
    $stmtLogs = $db->prepare("
        SELECT new_status, changed_by, notes, changed_at
        FROM order_status_logs
        WHERE order_id = ?
        ORDER BY changed_at ASC
    ");
    $stmtLogs->execute([$order_id]);
    $logs = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);

    // Buat map: new_status => changed_at (ambil yang pertama kali muncul)
    $timestampMap = [];
    foreach ($logs as $log) {
        $key = $log['new_status'];
        if (!isset($timestampMap[$key])) {
            $timestampMap[$key] = $log['changed_at'];
        }
    }
    // Step pertama (pending_payment) selalu ada sejak order dibuat
    if (!isset($timestampMap['pending_payment'])) {
        $timestampMap['pending_payment'] = $order['created_at'];
    }

    // ─────────────────────────────────────────────
    // 6. Ambil Info Pembayaran
    // ─────────────────────────────────────────────
    $stmtPayment = $db->prepare("
        SELECT status, uploaded_at, verified_at, admin_notes
        FROM payments
        WHERE order_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 1
    ");
    $stmtPayment->execute([$order_id]);
    $payment = $stmtPayment->fetch(PDO::FETCH_ASSOC);

    // ─────────────────────────────────────────────
    // 7. Ambil Item Pesanan
    // ─────────────────────────────────────────────

    // 7a. Paket Besar (order_items)
    $stmtItems = $db->prepare("
        SELECT product_name_snapshot AS name, product_price_snapshot AS price,
               quantity, subtotal
        FROM order_items
        WHERE order_id = ?
    ");
    $stmtItems->execute([$order_id]);
    $paket_besar = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    // 7b. Kue Satuan (order_packages + order_package_items)
    $stmtPkgs = $db->prepare("
        SELECT id, package_name AS name, quantity, package_price AS price
        FROM order_packages
        WHERE order_id = ?
    ");
    $stmtPkgs->execute([$order_id]);
    $packages = $stmtPkgs->fetchAll(PDO::FETCH_ASSOC);

    foreach ($packages as &$pkg) {
        $stmtPkgItems = $db->prepare("
            SELECT product_name_snapshot AS name, product_price_snapshot AS price, quantity
            FROM order_package_items
            WHERE order_package_id = ?
        ");
        $stmtPkgItems->execute([$pkg['id']]);
        $pkg['items'] = $stmtPkgItems->fetchAll(PDO::FETCH_ASSOC);
        unset($pkg['id']); // jangan expose ID internal
    }
    unset($pkg);

    // ─────────────────────────────────────────────
    // 8. Map Status ke Label & Icon UI
    // ─────────────────────────────────────────────
    $statusConfig = [
        'pending_payment'     => ['label' => 'Menunggu Pembayaran',    'icon' => 'hourglass_empty'],
        'pending_verification'=> ['label' => 'Menunggu Verifikasi',    'icon' => 'schedule'],
        'processing'          => ['label' => 'Sedang Diproses',        'icon' => 'restaurant'],
        'shipped'             => ['label' => 'Sedang Diantarkan',      'icon' => 'local_shipping'],
        'completed'           => ['label' => 'Selesai',                'icon' => 'flag'],
        'cancelled'           => ['label' => 'Dibatalkan',             'icon' => 'cancel'],
    ];

    // Urutan langkah timeline (cancelled tidak masuk urutan linear)
    $timelineSteps = [
        ['key' => 'pending_payment',      'label' => 'Pesanan Dibuat',           'icon' => 'receipt_long'],
        ['key' => 'pending_verification', 'label' => 'Bukti Bayar Dikirim',      'icon' => 'upload'],
        ['key' => 'processing',           'label' => 'Pembayaran Terverifikasi &amp; Sedang Diproses', 'icon' => 'restaurant'],
        ['key' => 'shipped',              'label' => 'Sedang Diantarkan',        'icon' => 'local_shipping'],
        ['key' => 'completed',            'label' => 'Selesai',                  'icon' => 'flag'],
    ];

    $currentStatus = $order['status'];

    // Hitung indeks aktif dalam timeline (untuk cancelled, mark semua sebagai none)
    $activeIndex = -1;
    if ($currentStatus !== 'cancelled') {
        foreach ($timelineSteps as $i => $step) {
            if ($step['key'] === $currentStatus) {
                $activeIndex = $i;
                break;
            }
        }
    }

    // Bangun array timeline dengan status done/active/pending
    $timeline = [];
    foreach ($timelineSteps as $i => $step) {
        $done   = ($activeIndex >= 0) && ($i < $activeIndex);
        $active = ($i === $activeIndex);
        $timeline[] = [
            'key'       => $step['key'],
            'label'     => $step['label'],
            'icon'      => $step['icon'],
            'done'      => $done,
            'active'    => $active,
            'timestamp' => $timestampMap[$step['key']] ?? null,
        ];
    }

    // ─────────────────────────────────────────────
    // 9. Format Alamat Pengiriman
    // ─────────────────────────────────────────────
    $addressParts = array_filter([
        $order['delivery_street'] . ($order['delivery_house_number'] ? ' ' . $order['delivery_house_number'] : ''),
        ($order['delivery_rt'] && $order['delivery_rw']) ? 'RT ' . $order['delivery_rt'] . '/RW ' . $order['delivery_rw'] : null,
        $order['delivery_kelurahan'],
        $order['delivery_kecamatan'],
        $order['delivery_postal_code'],
        $order['delivery_landmark'] ? '(Patokan: ' . $order['delivery_landmark'] . ')' : null,
    ]);
    $delivery_address = implode(', ', $addressParts);

    // ─────────────────────────────────────────────
    // 10. Susun Response JSON
    // ─────────────────────────────────────────────
    $currentStatusInfo = $statusConfig[$currentStatus] ?? ['label' => $currentStatus, 'icon' => 'help'];

    $response = [
        'success' => true,
        'order'   => [
            'order_number'          => $order['order_number'],
            'status'                => $currentStatus,
            'status_label'          => $currentStatusInfo['label'],
            'status_icon'           => $currentStatusInfo['icon'],
            'customer_name'         => $order['customer_name'],
            'delivery_date'         => $order['delivery_date'],
            'delivery_time'         => substr($order['delivery_time'], 0, 5), // HH:MM
            'delivery_address'      => $delivery_address,
            'order_notes'           => $order['order_notes'],
            'subtotal'              => (float) $order['subtotal'],
            'shipping_cost'         => (float) $order['shipping_cost'],
            'total_amount'          => (float) $order['total_amount'],
            'shipping_distance_km'  => (float) $order['shipping_distance_km'],
            'created_at'            => $order['created_at'],
            'payment'               => $payment ? [
                'status'      => $payment['status'],
                'uploaded_at' => $payment['uploaded_at'],
                'verified_at' => $payment['verified_at'],
                'admin_notes' => $payment['admin_notes'],
            ] : null,
            'timeline'              => $timeline,
            'items'                 => [
                'paket_besar' => $paket_besar,
                'kue_satuan'  => $packages,
            ],
        ],
    ];

    http_response_code(200);
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    error_log('Track order error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server. Silakan coba lagi.'
    ]);
}
