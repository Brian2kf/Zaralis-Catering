<?php
// ============================================================
// api/admin/dashboard/stats.php
// GET → Mengambil statistik ringkasan, data grafik, dan pesanan terbaru
// ============================================================

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/session.php';

session_init();

// Hanya admin yang boleh akses
if (!is_admin()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

try {
    $db = Database::getInstance();

    // 1. Overview Stats
    // New Orders (pending_payment)
    $stmt = $db->query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_payment'");
    $newOrders = $stmt->fetch()['count'];

    // Pending Verification (pending_verification)
    $stmt = $db->query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_verification'");
    $pendingVerification = $stmt->fetch()['count'];

    // Active Menu
    $stmt = $db->query("SELECT COUNT(*) as count FROM products WHERE is_active = 1");
    $activeMenu = $stmt->fetch()['count'];

    // 2. Chart Data (Last 7 Days)
    $labels = [];
    $salesData = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $shortDate = date('D', strtotime($date)); // Mon, Tue, etc.
        $labels[] = $shortDate;
        $salesData[$date] = 0;
    }

    $stmt = $db->query("
        SELECT DATE(created_at) as date, SUM(total_amount) as total 
        FROM orders 
        WHERE status NOT IN ('cancelled') 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
    ");
    $results = $stmt->fetchAll();

    foreach ($results as $row) {
        if (isset($salesData[$row['date']])) {
            $salesData[$row['date']] = (float)$row['total'];
        }
    }

    // Total sales for the week
    $totalSalesWeek = array_sum($salesData);

    // 3. Recent Orders
    $stmt = $db->query("
        SELECT order_number, customer_name, total_amount, status, created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 4
    ");
    $recentOrders = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'overview' => [
                'new_orders' => $newOrders,
                'pending_verification' => $pendingVerification,
                'active_menu' => $activeMenu
            ],
            'chart' => [
                'labels' => $labels,
                'values' => array_values($salesData),
                'total_sales_week' => $totalSalesWeek
            ],
            'recent_orders' => $recentOrders
        ]
    ]);

} catch (Exception $e) {
    error_log('Admin dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}
