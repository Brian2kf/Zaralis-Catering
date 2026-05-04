<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/session.php';
session_init();
require_admin();
?><!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Zarali's Catering</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap"
        rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/custom.css">
    <link rel="stylesheet" href="../css/admin.css">
</head>

<body class="admin-body">

    <!-- Mobile Header -->
    <div
        class="d-md-none bg-white border-bottom p-3 d-flex justify-content-between align-items-center w-100 position-fixed top-0 z-3">
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-link text-dark p-0" id="sidebarToggle">
                <span class="material-symbols-outlined fs-2">menu</span>
            </button>
            <h1 class="h5 fw-bold mb-0" style="font-family: 'Outfit', sans-serif;">Zarali's</h1>
        </div>
        <div class="sidebar-logo" style="width: 32px; height: 32px; font-size: 0.8rem;">ZC</div>
    </div>

    <!-- Sidebar Placeholder -->
    <div id="admin-sidebar-placeholder"></div>

    <!-- Main Content -->
    <main class="admin-main mt-5 mt-md-0">

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
            <div>
                <h2 class="display-6 fw-bold text-dark tracking-tight mb-1" style="font-family: 'Outfit', sans-serif;">
                    Dashboard Overview</h2>
                <p class="text-muted mb-0" id="dashboard-date">Memuat tanggal...</p>
            </div>
        </div>

        <!-- Summary Cards Grid (3 Columns) -->
        <div class="row g-4 mb-4">
            <!-- Card 1: Pesanan Baru -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <p class="stat-title">Pesanan Baru</p>
                        <div class="stat-icon primary">
                            <span class="material-symbols-outlined fs-5">shopping_basket</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2">
                        <p class="stat-value" id="new-orders-count">0</p>
                    </div>
                </div>
            </div>

            <!-- Card 2: Pending Verifikasi -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <p class="stat-title">Pending Verifikasi</p>
                        <div class="stat-icon warning">
                            <span class="material-symbols-outlined fs-5">hourglass_empty</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2">
                        <p class="stat-value" id="pending-verification-count">0</p>
                    </div>
                </div>
            </div>

            <!-- Card 3: Menu Aktif -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <p class="stat-title">Menu Aktif</p>
                        <div class="stat-icon info" style="background-color: rgba(113, 54, 56, 0.1); color: #713638;">
                            <span class="material-symbols-outlined fs-5">restaurant_menu</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2">
                        <p class="stat-value" id="active-menu-count">0</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts & Tables Section -->
        <div class="row g-4">
            <!-- Chart Section -->
            <div class="col-lg-8">
                <div class="content-card">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h3 class="content-title">Grafik Penjualan Mingguan</h3>
                        </div>
                        <button class="btn btn-link text-muted p-1 rounded">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <div class="w-100 position-relative" style="min-height: 250px;">
                        <canvas id="salesChart" style="max-height: 250px;"></canvas>
                    </div>
                </div>
            </div>

            <!-- Table Section -->
            <div class="col-lg-4">
                <div class="content-card d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="content-title fs-5">Pesanan Terbaru</h3>
                        <a href="pesanan.php" class="small text-primary-custom fw-semibold text-decoration-none">Lihat
                            Semua</a>
                    </div>

                    <div class="table-responsive flex-grow-1">
                        <table class="table table-borderless table-hover mb-0">
                            <thead class="border-bottom">
                                <tr>
                                    <th class="py-2 text-muted small text-uppercase tracking-wider fw-semibold px-0"
                                        style="font-size: 0.75rem;">ID & Pelanggan</th>
                                    <th class="py-2 text-muted small text-uppercase tracking-wider fw-semibold text-end px-0"
                                        style="font-size: 0.75rem;">Status / Nilai</th>
                                </tr>
                            </thead>
                            <tbody id="recent-orders-list" style="border-top: 1px solid rgba(0,0,0,0.05);">
                                <tr>
                                    <td colspan="2" class="py-4 text-center text-muted">Memuat data pesanan...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </main>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin/dashboard.js"></script>
</body>

</html>

