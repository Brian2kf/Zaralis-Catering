<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';
require_once __DIR__ . '/helpers/admin_middleware.php';
session_init();

// Proteksi halaman pelanggan
require_login();

// Admin tidak boleh akses halaman publik pelanggan (Poin 2A)
redirect_admin_from_public();
?><!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Pembelian - Zarali's Catering</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/pages/pembelian.css">
</head>
<body class="d-flex flex-column min-vh-100" style="background-color: #FFF8F0;">
    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Main Content -->
    <main class="container py-5 flex-grow-1">
        
        <header class="mb-4">
            <h1 class="display-6 fw-bold text-dark mb-2" style="font-family: 'Outfit', sans-serif; color: #0f5238 !important;">Daftar Transaksi</h1>
            <p class="text-muted">Pantau status pesanan dan riwayat transaksi catering Anda.</p>
        </header>

        <!-- Filters -->
        <div class="filter-card">
            <!-- Primary Status Tabs -->
            <div class="d-flex flex-wrap gap-2 mb-3 pb-3 border-bottom border-light">
                <button class="filter-btn">Semua</button>
                <button class="filter-btn active d-flex align-items-center gap-1">
                    Berlangsung
                    <span class="material-symbols-outlined fs-6">expand_more</span>
                </button>
                <button class="filter-btn">Berhasil</button>
                <button class="filter-btn">Tidak Berhasil</button>
            </div>
            
            <!-- Secondary Sub-filters -->
            <div class="d-flex flex-wrap gap-2 ps-2">
                <button class="subfilter-btn">Menunggu Konfirmasi</button>
                <button class="subfilter-btn active">Diproses</button>
                <button class="subfilter-btn">Dikirim</button>
                <button class="subfilter-btn">Tiba di Tujuan</button>
            </div>
        </div>

        <!-- Transactions Table -->
        <div class="table-card">
            <div class="table-responsive">
                <table class="table table-custom table-hover align-middle">
                    <thead>
                        <tr>
                            <th scope="col">ID Order</th>
                            <th scope="col">Tanggal Pemesanan</th>
                            <th scope="col">Item Utama</th>
                            <th scope="col">Total</th>
                            <th scope="col">Status</th>
                            <th scope="col" class="text-end">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Data transaksi akan dimuat secara dinamis via js/pembelian.js -->
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-wrapper d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <span class="small text-muted fw-medium">Menampilkan 1-3 dari 12 transaksi</span>
                <div class="d-flex gap-1">
                    <button class="page-btn" disabled>
                        <span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>
                    </button>
                    <a href="#" class="page-btn active">1</a>
                    <a href="#" class="page-btn">2</a>
                    <a href="#" class="page-btn">3</a>
                    <button class="page-btn">
                        <span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

    </main>

    <!-- Footer Placeholder -->
    <div id="footer-placeholder"></div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/pembelian.js"></script>
    <script src="js/load-components.js"></script>
</body>
</html>


