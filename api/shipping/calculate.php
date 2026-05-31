<?php
// ============================================================
// api/shipping/calculate.php
// Endpoint proxy untuk menghitung biaya pengiriman dari server.
// Mengatasi masalah CORS yang terjadi saat browser memanggil
// Nominatim / OSRM secara langsung.
// Sistem Tarif Hibrida:
//   - Biaya minimum: Rp 16.000 (dari DB)
//   - 0 - 20 km     : Rp 2.000 / km (Tier 1)
//   - > 20 km       : (20 × Rp2.000) + (sisa km × Rp2.500)
// ============================================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed."]);
    exit();
}

require_once '../../config/database.php';

// ============================================================
// Daftar kota/kabupaten Jabodetabek yang diizinkan
// ============================================================
$ALLOWED_CITIES = [
    'Kota Depok',
    'Kota Jakarta Selatan',
    'Kota Jakarta Timur',
    'Kota Jakarta Pusat',
    'Kota Jakarta Barat',
    'Kota Jakarta Utara',
    'Kota Bogor',
    'Kabupaten Bogor',
    'Kota Tangerang',
    'Kota Tangerang Selatan',
    'Kabupaten Tangerang',
    'Kota Bekasi',
    'Kabupaten Bekasi',
];

// --- Ambil pengaturan bisnis ---
try {
    $db = Database::getInstance();
    $stmtSettings = $db->query(
        "SELECT setting_key, setting_value FROM business_settings
         WHERE setting_key IN (
           'origin_latitude', 'origin_longitude',
           'shipping_min_cost', 'shipping_rate_tier1_km',
           'shipping_rate_tier2_km', 'shipping_tier_threshold_km'
         )"
    );
    $settings = [];
    while ($row = $stmtSettings->fetch(PDO::FETCH_ASSOC)) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Koneksi database gagal."]);
    exit();
}

$origin_lat       = floatval($settings['origin_latitude']           ?? -6.3683159);
$origin_lon       = floatval($settings['origin_longitude']          ?? 106.8461364);
$min_cost         = floatval($settings['shipping_min_cost']         ?? 16000);
$rate_tier1       = floatval($settings['shipping_rate_tier1_km']    ?? 2000);
$rate_tier2       = floatval($settings['shipping_rate_tier2_km']    ?? 2500);
$tier_threshold   = floatval($settings['shipping_tier_threshold_km'] ?? 20);

// --- Ambil data alamat dari frontend ---
$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->street) || empty($data->kel) || empty($data->kec) || empty($data->kota)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Harap lengkapi field Nama Jalan, Kelurahan, Kecamatan, dan Kota/Kabupaten."
    ]);
    exit();
}

$street = trim($data->street);
$house  = trim($data->house ?? '');
$kel    = trim($data->kel);
$kec    = trim($data->kec);
$kota   = trim($data->kota);

// ============================================================
// Validasi: kota harus termasuk dalam whitelist Jabodetabek
// ============================================================
if (!in_array($kota, $ALLOWED_CITIES)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Maaf, kami belum melayani pengiriman ke wilayah \"$kota\". Kami hanya melayani area Jabodetabek."
    ]);
    exit();
}

// ============================================================
// STEP 1: Geocoding via Nominatim (Server-side, tanpa CORS)
// Gunakan nama kota secara dinamis dari input frontend
// ============================================================
$queries = [
    "{$street}, {$kel}, {$kec}, {$kota}, Indonesia",
    "{$kel}, {$kec}, {$kota}, Indonesia",
    "{$kec}, {$kota}, Indonesia",
];

$geoResult = null;

foreach ($queries as $q) {
    $geoUrl = "https://nominatim.openstreetmap.org/search?"
        . http_build_query([
            'q'            => $q,
            'format'       => 'json',
            'limit'        => 1,
            'countrycodes' => 'id',
        ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $geoUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'User-Agent: ZaralisCatering/1.0 (https://zaralis-catering.test; kontak@zaralis.com)',
        ],
    ]);
    $geoResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("Nominatim cURL error for \"{$q}\": {$curlError}");
        continue;
    }

    if ($httpCode === 403) {
        http_response_code(503);
        echo json_encode([
            "success" => false,
            "message" => "Layanan geocoding sedang membatasi akses. Silakan coba lagi dalam beberapa saat."
        ]);
        exit();
    }

    if ($httpCode !== 200) {
        error_log("Nominatim HTTP {$httpCode} for \"{$q}\"");
        continue;
    }

    $geoData = json_decode($geoResponse, true);
    if (!empty($geoData) && isset($geoData[0]['lat'], $geoData[0]['lon'])) {
        $geoResult = $geoData[0];
        break;
    }
}

if (!$geoResult) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "Alamat tidak ditemukan. Pastikan nama jalan, kelurahan, kecamatan, dan kota sudah benar."
    ]);
    exit();
}

$custLat = floatval($geoResult['lat']);
$custLon = floatval($geoResult['lon']);

// ============================================================
// STEP 2: Routing via OSRM (Server-side, tanpa CORS)
// ============================================================
$distanceKm   = 0;
$usedFallback = false;

$osrmUrl = "https://router.project-osrm.org/route/v1/driving/"
    . "{$origin_lon},{$origin_lat};{$custLon},{$custLat}?overview=false";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $osrmUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER     => [
        'User-Agent: ZaralisCatering/1.0',
    ],
]);
$osrmResponse = curl_exec($ch);
$osrmHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$osrmError    = curl_error($ch);
curl_close($ch);

$osrmOk = false;

if (!$osrmError && $osrmHttpCode === 200) {
    $osrmData = json_decode($osrmResponse, true);
    if (isset($osrmData['routes'][0]['distance'])) {
        $distanceKm = $osrmData['routes'][0]['distance'] / 1000;
        $osrmOk = true;
    }
}

if (!$osrmOk) {
    // Fallback: Haversine × road factor
    $usedFallback = true;
    $distanceKm   = haversineDistance($origin_lat, $origin_lon, $custLat, $custLon) * 1.8;
    error_log("OSRM unavailable (HTTP {$osrmHttpCode}, err: {$osrmError}). Fallback Haversine: {$distanceKm} km");
}

// ============================================================
// STEP 3: Hitung biaya pengiriman dengan sistem HIBRIDA
// ============================================================
$roundedKm = ceil($distanceKm * 10) / 10; // Bulatkan ke 0.1 km terdekat ke atas

if ($roundedKm <= $tier_threshold) {
    // Jarak masih di Tier 1 (0 - threshold km)
    $calculated   = $roundedKm * $rate_tier1;
    $tier1_km     = $roundedKm;
    $tier2_km     = 0;
} else {
    // Jarak melewati threshold, hitung kelebihannya saja di Tier 2
    $tier1_km     = $tier_threshold;
    $tier2_km     = $roundedKm - $tier_threshold;
    $calculated   = ($tier1_km * $rate_tier1) + ($tier2_km * $rate_tier2);
}

$shippingCost = max($min_cost, (int) round($calculated));
$min_applied  = ($shippingCost === (int) $min_cost && round($calculated) < $min_cost);

// --- Kirim response ---
http_response_code(200);
echo json_encode([
    "success"        => true,
    "lat"            => $custLat,
    "lon"            => $custLon,
    "distance_km"    => round($distanceKm, 2),
    "rounded_km"     => $roundedKm,
    "shipping_cost"  => $shippingCost,
    "min_cost"       => $min_cost,
    "min_applied"    => $min_applied,
    "tier1_km"       => $tier1_km,
    "tier2_km"       => $tier2_km,
    "rate_tier1"     => $rate_tier1,
    "rate_tier2"     => $rate_tier2,
    "tier_threshold" => $tier_threshold,
    "used_fallback"  => $usedFallback,
]);

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
