<?php
// api/settings/show.php
// GET → Ambil pengaturan usaha (Publik)

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $db = Database::getInstance();
    // Ambil hanya field yang tidak sensitif
    $allowedKeys = ['business_name', 'business_phone', 'business_address'];
    $placeholders = implode(',', array_fill(0, count($allowedKeys), '?'));
    
    $stmt = $db->prepare("SELECT setting_key, setting_value FROM business_settings WHERE setting_key IN ($placeholders)");
    $stmt->execute($allowedKeys);
    $settingsRaw = $stmt->fetchAll();

    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    // Default values if missing
    if (!isset($settings['business_name'])) $settings['business_name'] = "Zarali's Catering";
    if (!isset($settings['business_phone'])) $settings['business_phone'] = "-";
    if (!isset($settings['business_address'])) $settings['business_address'] = "-";

    echo json_encode([
        'success' => true,
        'data' => $settings
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
