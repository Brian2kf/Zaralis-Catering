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
    <title>Keuangan - Zarali's Catering Admin</title>
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
    <main class="admin-main mt-5 mt-md-0 pb-5">

        <!-- Header Section -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 border-bottom pb-3">
            <div>
                <h2 class="display-6 fw-bold text-dark tracking-tight mb-1" style="font-family: 'Outfit', sans-serif;">
                    Keuangan</h2>
                <p class="text-muted mb-0 fs-6">Ringkasan aktivitas finansial dan arus kas.</p>
            </div>
            <!-- Filter Periode -->
            <div class="mt-3 mt-md-0">
                <select id="periodFilter" class="form-select border fw-medium text-dark"
                    style="font-size: 0.875rem; min-width: 180px;">
                    <option value="this_month">Bulan Ini</option>
                    <option value="last_month">Bulan Lalu</option>
                    <option value="this_year">Tahun Ini</option>
                </select>
            </div>
        </div>

        <!-- Summary Cards (3 Columns) -->
        <div class="row g-4 mb-4">
            <!-- Pemasukan -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="small text-muted fw-semibold text-uppercase tracking-wider">Total Pemasukan</span>
                        <div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 32px; height: 32px; background-color: rgba(45, 106, 79, 0.1); color: #2D6A4F;">
                            <span class="material-symbols-outlined" style="font-size: 1.25rem;">trending_up</span>
                        </div>
                    </div>
                    <h3 id="statIncome" class="display-6 fw-bold mb-0"
                        style="font-family: 'Outfit', sans-serif; color: #2D6A4F;">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </h3>
                </div>
            </div>

            <!-- Pengeluaran -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="small text-muted fw-semibold text-uppercase tracking-wider">Total
                            Pengeluaran</span>
                        <div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 32px; height: 32px; background-color: rgba(220, 53, 69, 0.1); color: #dc3545;">
                            <span class="material-symbols-outlined" style="font-size: 1.25rem;">trending_down</span>
                        </div>
                    </div>
                    <h3 id="statExpense" class="display-6 fw-bold mb-0 text-danger"
                        style="font-family: 'Outfit', sans-serif;">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </h3>
                </div>
            </div>

            <!-- Net Profit -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="small text-muted fw-semibold text-uppercase tracking-wider">Net Profit</span>
                        <div class="rounded-circle d-flex align-items-center justify-content-center"
                            style="width: 32px; height: 32px; background-color: rgba(224, 122, 95, 0.1); color: #E07A5F;">
                            <span class="material-symbols-outlined" style="font-size: 1.25rem;">account_balance</span>
                        </div>
                    </div>
                    <h3 id="statNetProfit" class="display-6 fw-bold mb-0 text-dark"
                        style="font-family: 'Outfit', sans-serif;">
                        <span class="placeholder-glow"><span class="placeholder col-8"></span></span>
                    </h3>
                </div>
            </div>
        </div>

        <!-- Actions & Filters -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <a href="tambah-transaksi.php"
                class="btn btn-primary-custom d-flex align-items-center gap-2 fw-semibold px-3 py-2 text-decoration-none">
                <span class="material-symbols-outlined fs-5">add</span>
                Tambah Transaksi Manual</a>
            <div class="d-flex gap-2">
                <select id="categoryFilter" class="form-select bg-light border fw-medium text-dark"
                    style="font-size: 0.875rem;">
                    <option value="">Semua Kategori</option>
                    <optgroup label="Pemasukan">
                        <option value="pesanan">Pendapatan Pesanan</option>
                        <option value="layanan_tambahan">Layanan Tambahan</option>
                        <option value="lainnya_p">Pemasukan Lainnya</option>
                    </optgroup>
                    <optgroup label="Pengeluaran">
                        <option value="bahan_baku">Bahan Baku</option>
                        <option value="gaji_pegawai">Gaji Pegawai</option>
                        <option value="operasional">Operasional</option>
                        <option value="transportasi">Transportasi</option>
                        <option value="pemasaran">Pemasaran</option>
                        <option value="perlengkapan">Perlengkapan</option>
                        <option value="lainnya_x">Pengeluaran Lainnya</option>
                    </optgroup>
                </select>
                <button id="btnFilterLainnya"
                    class="btn btn-light border bg-white d-flex align-items-center gap-2 fw-medium px-3 text-dark"
                    style="font-size: 0.875rem; white-space: nowrap;">
                    <span class="material-symbols-outlined fs-5">filter_list</span>
                    Filter Lainnya
                </button>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="row mb-4">
            <div class="col-lg-12">
                <div class="content-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="content-title fs-4 mb-0">Grafik Arus Kas</h3>
                        <span id="chartPeriodLabel" class="badge bg-light text-muted border fw-medium px-3 py-2"
                            style="font-size: 0.8rem;"></span>
                    </div>

                    <!-- Chart Canvas -->
                    <div style="position: relative; height: 230px;">
                        <canvas id="cashFlowChart"></canvas>
                        <!-- Skeleton loader -->
                        <div id="chartSkeleton" class="d-flex align-items-center justify-content-center"
                            style="height: 230px;">
                            <div class="text-center text-muted">
                                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                <span style="font-size: 0.875rem;">Memuat grafik...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div class="d-flex justify-content-center gap-4 mt-4">
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-1" style="width: 12px; height: 12px; background-color: #2D6A4F;"></div>
                            <span class="small text-muted fw-medium">Pemasukan</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <div class="rounded-1" style="width: 12px; height: 12px; background-color: #dc3545;"></div>
                            <span class="small text-muted fw-medium">Pengeluaran</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Transactions Table -->
        <div class="content-card p-0 overflow-hidden">
            <div class="p-4 border-bottom bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
                <h3 class="content-title fs-5 mb-0">Transaksi Terakhir</h3>
                <a href="semua-transaksi.php"
                    class="small fw-semibold text-primary-custom text-decoration-none hover-underline">Lihat Semua</a>
            </div>

            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="min-width: 800px;">
                    <thead class="bg-light">
                        <tr>
                            <th class="py-3 px-4 text-muted small fw-semibold">Tanggal</th>
                            <th class="py-3 px-4 text-muted small fw-semibold">Deskripsi</th>
                            <th class="py-3 px-4 text-muted small fw-semibold">Kategori</th>
                            <th class="py-3 px-4 text-muted small fw-semibold text-end">Nominal</th>
                            <th class="py-3 px-4 text-muted small fw-semibold text-center">Tipe</th>
                        </tr>
                    </thead>
                    <tbody id="recentTransactionsBody" class="border-top-0">
                        <!-- Skeleton Rows -->
                        <tr>
                            <td colspan="5" class="p-4 text-center text-muted">
                                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                Memuat transaksi...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Filter Lainnya -->
        <div class="modal fade" id="filterModal" tabindex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold" id="filterModalLabel"
                            style="font-family: 'Outfit', sans-serif;">Filter Lanjutan</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body pt-3">
                        <div class="mb-3">
                            <label class="form-label fw-semibold small text-muted text-uppercase">Rentang
                                Tanggal</label>
                            <div class="d-flex gap-2 align-items-center">
                                <input type="date" id="filterDateFrom" class="form-control"
                                    style="font-size: 0.875rem;">
                                <span class="text-muted small">s/d</span>
                                <input type="date" id="filterDateTo" class="form-control" style="font-size: 0.875rem;">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold small text-muted text-uppercase">Tipe Transaksi</label>
                            <div class="d-flex gap-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="filterType" id="filterTypeAll"
                                        value="" checked>
                                    <label class="form-check-label small" for="filterTypeAll">Semua</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="filterType" id="filterTypeIncome"
                                        value="income">
                                    <label class="form-check-label small" for="filterTypeIncome">Pemasukan</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="filterType"
                                        id="filterTypeExpense" value="expense">
                                    <label class="form-check-label small" for="filterTypeExpense">Pengeluaran</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" id="btnResetFilter" class="btn btn-light border fw-medium">Reset</button>
                        <button type="button" id="btnApplyFilter" class="btn btn-primary-custom fw-semibold">Terapkan
                            Filter</button>
                    </div>
                </div>
            </div>
        </div>

    </main>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin-keuangan.js"></script>
</body>

</html>