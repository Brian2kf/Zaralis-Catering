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
    <title>Menu - Zarali's Catering Admin</title>
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
                    Menu</h2>
                <p class="text-muted mb-0 fs-6">Kelola produk katering dan koleksi kue tradisional Nusantara Zarali's
                    dengan mudah.</p>
            </div>
            <a href="tambah-menu.php"
                class="btn btn-primary-custom d-flex align-items-center gap-2 mt-3 mt-md-0 fw-semibold px-4 text-decoration-none">
                <span class="material-symbols-outlined fs-5">add</span>
                Tambah Produk</a>
        </div>

        <!-- Stats Overview Cards (3 Columns) -->
        <div class="row g-4 mb-4">
            <!-- Card 1 -->
            <div class="col-md-4">
                <div class="stat-card"
                    style="background-color: rgba(45, 106, 79, 0.1); border-color: rgba(45, 106, 79, 0.2);">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="material-symbols-outlined fs-1" style="color: #2D6A4F;">inventory_2</span>
                        <span class="badge bg-white text-dark border">Aktif</span>
                    </div>
                    <p class="mb-0 text-dark fw-medium small">Total Item Menu</p>
                    <h3 id="statTotalItem" class="display-6 fw-bold mb-0 text-dark fs-3"
                        style="font-family: 'Outfit', sans-serif;">-</h3>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="col-md-4">
                <div class="stat-card"
                    style="background-color: rgba(224, 122, 95, 0.1); border-color: rgba(224, 122, 95, 0.2);">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="material-symbols-outlined fs-1" style="color: #E07A5F;">trending_up</span>
                        <span class="badge bg-white text-dark border">Populer</span>
                    </div>
                    <p class="mb-0 text-dark fw-medium small">Menu Terlaris</p>
                    <h3 id="statBestSeller" class="display-6 fw-bold mb-0 text-dark fs-3"
                        style="font-family: 'Outfit', sans-serif; line-height: 1.2;">-</h3>
                </div>
            </div>

            <!-- Card 3 -->
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="material-symbols-outlined fs-1 text-muted">update</span>
                        <span class="badge bg-light text-dark border">Info</span>
                    </div>
                    <p class="mb-0 text-muted fw-medium small">Pembaharuan Terakhir</p>
                    <h3 id="statLastUpdate" class="display-6 fw-bold mb-0 text-dark fs-3"
                        style="font-family: 'Outfit', sans-serif; line-height: 1.2;">-</h3>
                </div>
            </div>
        </div>

        <!-- Table Container -->
        <div class="content-card p-0 overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="min-width: 800px;">
                    <thead class="bg-light">
                        <tr>
                            <th class="py-3 px-4 text-muted small fw-semibold text-uppercase tracking-wider">Item Menu
                            </th>
                            <th class="py-3 px-4 text-muted small fw-semibold text-uppercase tracking-wider">Kategori
                            </th>
                            <th class="py-3 px-4 text-muted small fw-semibold text-uppercase tracking-wider">Harga
                                Satuan</th>
                            <th class="py-3 px-4 text-muted small fw-semibold text-uppercase tracking-wider text-end">
                                Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="menuTableBody" class="border-top-0">
                        <!-- Content will be dynamically inserted here via JS -->
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="p-4 border-top d-flex justify-content-between align-items-center bg-light bg-opacity-50"
                style="border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;">
                <span id="paginationText" class="small text-muted fw-medium">Memuat...</span>
                <div id="paginationContainer" class="d-flex gap-1">
                    <!-- Pagination will be inserted here -->
                </div>
            </div>
        </div>

    </main>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin/admin-menu.js"></script>
</body>

</html>

