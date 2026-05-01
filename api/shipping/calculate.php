<?php
// ============================================================
// api/shipping/calculate.php
// Endpoint proxy untuk menghitung biaya pengiriman dari server.
// Mengatasi masalah CORS yang terjadi saat browser memanggil
// Nominatim / OSRM secara langsung.
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

// --- Ambil pengaturan bisnis ---
try {
    $db = Database::getInstance();
    $stmtSettings = $db->query(
        "SELECT setting_key, setting_value FROM business_settings
         WHERE setting_key IN ('origin_latitude', 'origin_longitude', 'shipping_rate_per_km')"
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

$origin_lat  = floatval($settings['origin_latitude']  ?? -6.3683159);
$origin_lon  = floatval($settings['origin_longitude']  ?? 106.8461364);
$rate_per_km = floatval($settings['shipping_rate_per_km'] ?? 7000);

// --- Ambil data alamat dari frontend ---
$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->street) || empty($data->kel) || empty($data->kec)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Harap lengkapi field Nama Jalan, Kelurahan, dan Kecamatan."
    ]);
    exit();
}

$street = trim($data->street);
$house  = trim($data->house ?? '');
$kel    = trim($data->kel);
$kec    = trim($data->kec);

// ============================================================
// STEP 1: Geocoding via Nominatim (Server-side, tanpa CORS)
// ============================================================
$suffix  = "Kota Depok, Jawa Barat";
$queries = [
    "{$street}, {$kel}, {$kec}, {$suffix}",
    "{$kel}, {$kec}, {$suffix}",
    "{$kec}, {$suffix}",
];

$geoResult = null;

foreach ($queries as $q) {
    $geoUrl = "https://nominatim.openstreetmap.org/search?"
        . http_build_query([
            'q'            => $q,
            'format'       => 'json',
            'limit'        => 1,
            'countrycodes' => 'id',
            'viewbox'      => '106.7,-6.3,106.9,-6.5',
            'bounded'      => 0,
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
        // Rate limited — beri tahu frontend
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
        "message" => "Alamat tidak ditemukan. Pastikan nama jalan, kelurahan, dan kecamatan sudah benar."
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
// STEP 3: Hitung biaya pengiriman
// ============================================================
$roundedKm    = ceil($distanceKm * 10) / 10; // Bulatkan ke 0.1 km terdekat ke atas
$shippingCost = round($roundedKm * $rate_per_km);

// --- Kirim response ---
http_response_code(200);
echo json_encode([
    "success"       => true,
    "lat"           => $custLat,
    "lon"           => $custLon,
    "distance_km"   => round($distanceKm, 2),
    "rounded_km"    => $roundedKm,
    "shipping_cost" => $shippingCost,
    "rate_per_km"   => $rate_per_km,
    "used_fallback" => $usedFallback,
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
