<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../../config/database.php';
session_start();

// Mendapatkan koneksi database
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Koneksi database gagal."]);
    exit();
}

// Mengambil data JSON dari frontend
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(["message" => "Data pesanan tidak valid."]);
    exit();
}

try {
    // Memulai Database Transaction
    $db->beginTransaction();

    // 1. Ambil pengaturan bisnis untuk asal pengiriman dan tarif
    $stmtSettings = $db->query("SELECT setting_key, setting_value FROM business_settings WHERE setting_key IN ('origin_latitude', 'origin_longitude', 'shipping_rate_per_km')");
    $settings = [];
    while ($row = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    $origin_lat = $settings['origin_latitude'];
    $origin_lon = $settings['origin_longitude'];
    $rate_per_km = $settings['shipping_rate_per_km'];

    // 2. Validasi Jarak di Sisi Server (OSRM + Haversine fallback)
    $dest_lat = $data->dest_latitude;
    $dest_lon = $data->dest_longitude;
    $frontend_distance = $data->shipping_distance_km;

    $osrm_url = "https://router.project-osrm.org/route/v1/driving/{$origin_lon},{$origin_lat};{$dest_lon},{$dest_lat}?overview=false";

    // Melakukan request ke OSRM dengan timeout dan User-Agent
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $osrm_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER     => ['User-Agent: ZaralisCatering/1.0'],
    ]);
    $osrm_response = curl_exec($ch);
    $osrm_http     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $osrm_error    = curl_error($ch);
    curl_close($ch);

    $server_distance_km = null;

    if (!$osrm_error && $osrm_http === 200) {
        $osrm_data = json_decode($osrm_response, true);
        if (isset($osrm_data['routes'][0]['distance'])) {
            $server_distance_km = $osrm_data['routes'][0]['distance'] / 1000;
        }
    }

    // Fallback: Haversine × road factor jika OSRM tidak tersedia
    if ($server_distance_km === null) {
        error_log("OSRM unavailable (HTTP {$osrm_http}, err: {$osrm_error}). Using Haversine fallback for validation.");
        $server_distance_km = haversineDistance($origin_lat, $origin_lon, $dest_lat, $dest_lon) * 1.8;
    }

    // Toleransi perbedaan jarak (maks. 2 km) — mengakomodasi variasi minor
    if (abs($server_distance_km - $frontend_distance) > 2.0) {
        throw new Exception("Jarak pengiriman tidak valid. Harap periksa kembali alamat Anda.");
    }

    // Gunakan jarak dari frontend (yang sudah divalidasi) agar harga yang
    // ditampilkan di halaman checkout sama persis dengan yang tersimpan di database.
    // Formula disamakan: ceil(km × 10) / 10 × rate (bulatkan ke 0.1 km terdekat ke atas)
    $validated_km = ceil($frontend_distance * 10) / 10;
    $shipping_cost = round($validated_km * $rate_per_km);

    // 3. Generate Nomor Pesanan CTR-YYYYMMDD-XXXX
    $today = date('Y-m-d');

    // Insert atau Update counter harian
    $stmtCounter = $db->prepare("INSERT INTO order_counter (counter_date, last_counter) VALUES (?, 1) ON DUPLICATE KEY UPDATE last_counter = last_counter + 1");
    $stmtCounter->execute([$today]);

    // Ambil counter terbaru
    $stmtGetCounter = $db->prepare("SELECT last_counter FROM order_counter WHERE counter_date = ?");
    $stmtGetCounter->execute([$today]);
    $counter = $stmtGetCounter->fetchColumn();

    $order_number = 'CTR-' . date('Ymd') . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);

    // 4. Siapkan Data User (Login atau Guest)
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

    $subtotal = $data->subtotal;
    $total_amount = $subtotal + $shipping_cost;

    // 5. Simpan ke tabel orders
    $queryOrder = "INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone, 
        status, subtotal, shipping_cost, total_amount, shipping_distance_km, 
        delivery_street, delivery_house_number, delivery_rt, delivery_rw, 
        delivery_kelurahan, delivery_kecamatan, delivery_postal_code, delivery_landmark, 
        dest_latitude, dest_longitude, delivery_date, delivery_time, order_notes
    ) VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmtOrder = $db->prepare($queryOrder);
    $stmtOrder->execute([
        $order_number,
        $user_id,
        $data->customer_name,
        $data->customer_email,
        $data->customer_phone,
        $subtotal,
        $shipping_cost,
        $total_amount,
        $server_distance_km,
        $data->delivery_street,
        $data->delivery_house_number,
        $data->delivery_rt,
        $data->delivery_rw,
        $data->delivery_kelurahan,
        $data->delivery_kecamatan,
        $data->delivery_postal_code,
        $data->delivery_landmark,
        $dest_lat,
        $dest_lon,
        $data->delivery_date,
        $data->delivery_time,
        $data->order_notes
    ]);

    $order_id = $db->lastInsertId();

    // Siapkan kueri untuk mencari ID asli produk berdasarkan namanya
    $stmtFindProd = $db->prepare("SELECT id FROM products WHERE name = ? LIMIT 1");

    // 6. Simpan Paket Kue Satuan (Jika Ada)
    if (!empty($data->cart->kue_satuan)) {
        foreach ($data->cart->kue_satuan as $paket) {

            // Hitung ulang harga paket
            $package_price = 0;
            foreach ($paket->items as $item) {
                $item_qty = isset($item->qty) ? $item->qty : 1;
                $package_price += ($item->price * $item_qty);
            }

            $stmtPkg = $db->prepare("INSERT INTO order_packages (order_id, package_name, quantity, package_price) VALUES (?, ?, ?, ?)");
            $pkg_qty = isset($paket->qty) ? $paket->qty : 1;
            $stmtPkg->execute([$order_id, $paket->name, $pkg_qty, $package_price]);
            $package_id = $db->lastInsertId();

            // Simpan item di dalam paket tersebut
            foreach ($paket->items as $item) {
                $stmtFindProd->execute([$item->name]);
                $real_product_id = $stmtFindProd->fetchColumn();
                $real_product_id = $real_product_id ? $real_product_id : null;

                $item_qty = isset($item->qty) ? $item->qty : 1;

                $stmtItem = $db->prepare("INSERT INTO order_package_items (order_package_id, product_id, product_name_snapshot, product_price_snapshot, quantity) VALUES (?, ?, ?, ?, ?)");
                $stmtItem->execute([$package_id, $real_product_id, $item->name, $item->price, $item_qty]);
            }
        }
    }

    // 7. Simpan Paket Besar (Jika Ada)
    if (!empty($data->cart->paket_besar)) {
        foreach ($data->cart->paket_besar as $item) {
            $stmtFindProd->execute([$item->name]);
            $real_product_id = $stmtFindProd->fetchColumn();
            $real_product_id = $real_product_id ? $real_product_id : null;

            $item_qty = isset($item->qty) ? $item->qty : 1;

            $stmtBesar = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name_snapshot, product_price_snapshot, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            $subtotal_item = $item->price * $item_qty;
            $stmtBesar->execute([$order_id, $real_product_id, $item->name, $item->price, $item_qty, $subtotal_item]);
        }
    }

    // Selesaikan transaksi
    $db->commit();

    http_response_code(201);
    echo json_encode([
        "message" => "Pesanan berhasil dibuat.",
        "order_number" => $order_number
    ]);

} catch (Exception $e) {
    // Batalkan seluruh proses jika ada yang gagal
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["message" => "Terjadi kesalahan: " . $e->getMessage()]);
}

// ============================================================
// Helper: Haversine Distance (km)
// ============================================================
function haversineDistance($lat1, $lon1, $lat2, $lon2)
{
    $R = 6371; // Radius bumi dalam km
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2
       + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}
?>