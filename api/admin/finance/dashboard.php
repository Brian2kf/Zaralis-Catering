<?php
// ============================================================
// api/admin/finance/dashboard.php
// GET → Summary stats + data grafik + transaksi terbaru
//
// Query params (opsional):
//   period = this_month | last_month | this_year | custom
//   date_from = YYYY-MM-DD  (wajib jika period=custom)
//   date_to   = YYYY-MM-DD  (wajib jika period=custom)
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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Tentukan rentang tanggal berdasarkan period ─────────────
$period = $_GET['period'] ?? 'this_month';
$dateFrom = $_GET['date_from'] ?? null;
$dateTo = $_GET['date_to'] ?? null;

$today = new DateTime('now', new DateTimeZone('Asia/Jakarta'));

switch ($period) {
    case 'last_month':
        $first = (clone $today)->modify('first day of last month')->format('Y-m-d');
        $last = (clone $today)->modify('last day of last month')->format('Y-m-d');
        break;

    case 'this_year':
        $first = $today->format('Y') . '-01-01';
        $last = $today->format('Y') . '-12-31';
        break;

    case 'custom':
        if (!$dateFrom || !$dateTo) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'date_from dan date_to wajib diisi untuk period=custom.']);
            exit;
        }
        $first = $dateFrom;
        $last = $dateTo;
        break;

    default: // this_month
        $first = (clone $today)->modify('first day of this month')->format('Y-m-d');
        $last = (clone $today)->modify('last day of this month')->format('Y-m-d');
        break;
}

try {
    $db = Database::getInstance();

    // ── 1. Summary: total pemasukan, pengeluaran, net profit ──
    $stmtSummary = $db->prepare("
        SELECT
            type,
            SUM(amount) AS total
        FROM financial_transactions
        WHERE transaction_date BETWEEN :from AND :to
        GROUP BY type
    ");
    $stmtSummary->execute([':from' => $first, ':to' => $last]);

    $income = 0.0;
    $expense = 0.0;
    while ($row = $stmtSummary->fetch()) {
        if ($row['type'] === 'income')
            $income = (float) $row['total'];
        if ($row['type'] === 'expense')
            $expense = (float) $row['total'];
    }

    // ── 2. Grafik arus kas mingguan (4 minggu terakhir dalam range) ──
    // Bagi range menjadi 4 bucket minggu
    $startDate = new DateTime($first);
    $endDate = new DateTime($last);
    $diffDays = (int) $startDate->diff($endDate)->days + 1;
    $bucketDays = max(1, (int) ceil($diffDays / 4));

    $chartLabels = [];
    $chartIncome = [];
    $chartExpense = [];

    $stmtChart = $db->prepare("
        SELECT type, SUM(amount) AS total
        FROM financial_transactions
        WHERE transaction_date BETWEEN :from AND :to
        GROUP BY type
    ");

    $cursor = clone $startDate;
    for ($week = 1; $week <= 4; $week++) {
        $weekStart = clone $cursor;
        $cursor->modify("+{$bucketDays} days");
        $weekEnd = (clone $cursor)->modify('-1 day');

        // Jangan melebihi endDate
        if ($weekEnd > $endDate)
            $weekEnd = clone $endDate;

        $wsStr = $weekStart->format('Y-m-d');
        $weStr = $weekEnd->format('Y-m-d');

        $stmtChart->execute([':from' => $wsStr, ':to' => $weStr]);

        $wIncome = 0.0;
        $wExpense = 0.0;
        while ($row = $stmtChart->fetch()) {
            if ($row['type'] === 'income')
                $wIncome = (float) $row['total'];
            if ($row['type'] === 'expense')
                $wExpense = (float) $row['total'];
        }

        $chartLabels[] = 'Minggu ' . $week;
        $chartIncome[] = $wIncome;
        $chartExpense[] = $wExpense;
    }

    // ── 3. Transaksi terbaru (10 baris) ───────────────────────
    $stmtRecent = $db->prepare("
        SELECT
            ft.id,
            ft.type,
            ft.category,
            ft.amount,
            ft.description,
            ft.transaction_date,
            ft.receipt_path,
            ft.created_by,
            o.order_number
        FROM financial_transactions ft
        LEFT JOIN orders o ON o.id = ft.order_id
        WHERE ft.transaction_date BETWEEN :from AND :to
        ORDER BY ft.transaction_date DESC, ft.id DESC
        LIMIT 10
    ");
    $stmtRecent->execute([':from' => $first, ':to' => $last]);
    $recentTransactions = $stmtRecent->fetchAll();

    foreach ($recentTransactions as &$t) {
        $t['id'] = (int) $t['id'];
        $t['amount'] = (float) $t['amount'];
    }
    unset($t);

    // ── 4. Response ────────────────────────────────────────────
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'period' => [
            'label' => $period,
            'date_from' => $first,
            'date_to' => $last,
        ],
        'summary' => [
            'total_income' => $income,
            'total_expense' => $expense,
            'net_profit' => $income - $expense,
        ],
        'chart' => [
            'labels' => $chartLabels,
            'income' => $chartIncome,
            'expense' => $chartExpense,
        ],
        'recent_transactions' => $recentTransactions,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Finance dashboard error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}