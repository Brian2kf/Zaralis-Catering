<?php
// ============================================================
// api/admin/finance/transactions.php
// GET  → Daftar semua transaksi (dengan filter + pagination)
//
// Query params:
//   page        = int (default 1)
//   per_page    = int (default 15, maks 100)
//   type        = income | expense
//   category    = string
//   search      = string (cari di description / order_number)
//   date_from   = YYYY-MM-DD
//   date_to     = YYYY-MM-DD
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

// ── Ambil & validasi parameter ─────────────────────────────
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = max(1, min(100, (int) ($_GET['per_page'] ?? 15)));
$type = trim($_GET['type'] ?? '');
$category = trim($_GET['category'] ?? '');
$search = trim($_GET['search'] ?? '');
$dateFrom = trim($_GET['date_from'] ?? '');
$dateTo = trim($_GET['date_to'] ?? '');

$offset = ($page - 1) * $perPage;

// ── Bangun WHERE clause secara dinamis ─────────────────────
$conditions = [];
$params = [];

if ($type !== '' && in_array($type, ['income', 'expense'])) {
    $conditions[] = 'ft.type = :type';
    $params[':type'] = $type;
}

if ($category !== '') {
    $conditions[] = 'ft.category = :category';
    $params[':category'] = $category;
}

if ($search !== '') {
    $conditions[] = '(ft.description LIKE :search OR o.order_number LIKE :search2)';
    $params[':search'] = '%' . $search . '%';
    $params[':search2'] = '%' . $search . '%';
}

if ($dateFrom !== '') {
    $conditions[] = 'ft.transaction_date >= :date_from';
    $params[':date_from'] = $dateFrom;
}

if ($dateTo !== '') {
    $conditions[] = 'ft.transaction_date <= :date_to';
    $params[':date_to'] = $dateTo;
}

$where = count($conditions) > 0
    ? 'WHERE ' . implode(' AND ', $conditions)
    : '';

try {
    $db = Database::getInstance();

    // Total rows
    $stmtCount = $db->prepare("
        SELECT COUNT(*)
        FROM financial_transactions ft
        LEFT JOIN orders o ON o.id = ft.order_id
        $where
    ");
    $stmtCount->execute($params);
    $totalRows = (int) $stmtCount->fetchColumn();

    // Ambil data
    $stmtTrx = $db->prepare("
        SELECT
            ft.id,
            ft.type,
            ft.category,
            ft.amount,
            ft.description,
            ft.transaction_date,
            ft.receipt_path,
            ft.created_by,
            ft.created_at,
            o.order_number
        FROM financial_transactions ft
        LEFT JOIN orders o ON o.id = ft.order_id
        $where
        ORDER BY ft.transaction_date DESC, ft.id DESC
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $key => $val) {
        $stmtTrx->bindValue($key, $val);
    }
    $stmtTrx->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmtTrx->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmtTrx->execute();
    $transactions = $stmtTrx->fetchAll();

    foreach ($transactions as &$t) {
        $t['id'] = (int) $t['id'];
        $t['amount'] = (float) $t['amount'];
    }
    unset($t);

    // Summary dalam range yang sama (untuk tampilkan sub-total di halaman)
    $stmtSum = $db->prepare("
        SELECT type, SUM(amount) AS total
        FROM financial_transactions ft
        LEFT JOIN orders o ON o.id = ft.order_id
        $where
        GROUP BY type
    ");
    $stmtSum->execute($params);

    $sumIncome = 0.0;
    $sumExpense = 0.0;
    while ($row = $stmtSum->fetch()) {
        if ($row['type'] === 'income')
            $sumIncome = (float) $row['total'];
        if ($row['type'] === 'expense')
            $sumExpense = (float) $row['total'];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total_rows' => $totalRows,
            'total_pages' => (int) ceil($totalRows / $perPage),
        ],
        'filter_summary' => [
            'total_income' => $sumIncome,
            'total_expense' => $sumExpense,
            'net' => $sumIncome - $sumExpense,
        ],
        'transactions' => $transactions,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Finance transactions error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server.']);
}