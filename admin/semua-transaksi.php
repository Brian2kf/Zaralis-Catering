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
    <title>Semua Transaksi - Zarali's Catering Admin</title>
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
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-1">
                        <li class="breadcrumb-item"><a href="keuangan.php"
                                class="text-decoration-none text-muted">Keuangan</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Semua Transaksi</li>
                    </ol>
                </nav>
                <h2 class="display-6 fw-bold text-dark tracking-tight mb-1" style="font-family: 'Outfit', sans-serif;">
                    Semua Transaksi</h2>
                <p class="text-muted mb-0 fs-6">Riwayat lengkap aktivitas finansial, pemasukan, dan pengeluaran.</p>
            </div>
        </div>

        <!-- Actions & Filters -->
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
            <div class="position-relative" style="max-width: 300px; width: 100%;">
                <span class="material-symbols-outlined position-absolute top-50 translate-middle-y ms-3 text-muted">search</span>
                <input type="text" id="searchInput" class="form-control rounded-pill ps-5 py-2" placeholder="Cari deskripsi...">
            </div>
            <div class="d-flex gap-2">
                <select id="categoryFilter" class="form-select bg-light border fw-medium text-dark rounded-pill"
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
                <!-- Ubah input date tunggal menjadi form dengan rentang (opsional, atau tetap satu date jika API mendukung) -->
                <!-- API mendukung date_from dan date_to, jadi kita pakai satu untuk kesederhanaan filter harian, atau ubah jadi daterange. Kita akan pakai single date untuk filter harian yang mempassing date_from dan date_to dengan nilai sama -->
                <input type="date" id="dateFilter" class="form-control border fw-medium text-dark rounded-pill"
                    style="font-size: 0.875rem; width: auto;">
            </div>
        </div>

        <!-- All Transactions Table -->
        <div class="content-card p-0 overflow-hidden mb-4">
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
                    <tbody id="transactionsBody" class="border-top-0">
                        <!-- Transaksi akan dimuat melalui JavaScript -->
                        <tr>
                            <td colspan="5" class="p-4 text-center text-muted">
                                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                                Memuat transaksi...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="p-4 border-top bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
                <span id="paginationInfo" class="text-muted small">Menampilkan 0 hingga 0 dari 0 transaksi</span>
                <nav aria-label="Page navigation">
                    <ul id="paginationNav" class="pagination pagination-sm mb-0">
                        <!-- Paginasi akan dimuat melalui JavaScript -->
                    </ul>
                </nav>
            </div>
        </div>

    </main>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin-semua-transaksi.js"></script>
</body>

</html>

