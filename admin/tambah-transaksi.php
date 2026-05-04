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
    <title>Tambah Transaksi Manual - Zarali's Catering Admin</title>
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

        <div class="container-fluid max-w-4xl mx-auto px-0">
            <!-- Header Section -->
            <div class="mb-4">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <a href="keuangan.php"
                        class="btn btn-sm btn-light border p-1 d-flex align-items-center text-muted">
                        <span class="material-symbols-outlined fs-6">arrow_back</span>
                    </a>
                    <h2 class="fs-3 fw-bold text-dark tracking-tight mb-0"
                        style="font-family: 'Outfit', sans-serif; color: #2D6A4F !important;">Tambah Transaksi Manual
                    </h2>
                </div>
            </div>

            <!-- Form Card -->
            <div class="content-card h-auto p-0 d-flex flex-column mb-4">
                <div class="p-4 border-bottom bg-light bg-opacity-50"
                    style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;">
                    <h4 class="mb-0 fs-5 d-flex align-items-center gap-2"
                        style="color: #191c1a; font-family: 'Outfit', sans-serif;">
                        <span class="material-symbols-outlined text-primary-custom">receipt_long</span>
                        Detail Transaksi
                    </h4>
                </div>

                <div class="p-4">
                    <form>
                        <div class="row g-4 g-lg-5">

                            <!-- Left Column: Form Fields -->
                            <div class="col-lg-7">
                                <div class="row g-4">

                                    <!-- Tipe Transaksi -->
                                    <div class="col-12">
                                        <label class="form-label d-block">Tipe Transaksi</label>
                                        <div class="d-flex gap-3">
                                            <div class="flex-grow-1">
                                                <input type="radio" class="btn-check btn-check-custom"
                                                    name="type" id="typeIncome" value="income" checked>
                                                <label
                                                    class="btn btn-outline-success type-selector-btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                                                    for="typeIncome">
                                                    <span class="material-symbols-outlined fs-5">arrow_downward</span>
                                                    Pemasukan
                                                </label>
                                            </div>
                                            <div class="flex-grow-1">
                                                <input type="radio" class="btn-check btn-check-custom"
                                                    name="type" id="typeExpense" value="expense">
                                                <label
                                                    class="btn btn-outline-danger type-selector-btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                                                    for="typeExpense">
                                                    <span class="material-symbols-outlined fs-5">arrow_upward</span>
                                                    Pengeluaran
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Tanggal Transaksi -->
                                    <div class="col-md-6">
                                        <label class="form-label" for="transDate">Tanggal Transaksi</label>
                                        <input type="date" class="form-control" id="transDate">
                                    </div>

                                    <!-- Kategori -->
                                    <div class="col-md-6">
                                        <label class="form-label" for="category">Kategori</label>
                                        <select class="form-select" id="category">
                                            <option value="" selected disabled>Pilih Kategori</option>
                                            <option value="pesanan">Pendapatan Pesanan</option>
                                            <option value="bahan">Bahan Baku</option>
                                            <option value="operasional">Operasional</option>
                                            <option value="lainnya">Lainnya</option>
                                        </select>
                                    </div>

                                    <!-- Nominal -->
                                    <div class="col-12">
                                        <label class="form-label" for="amount">Nominal Transaksi</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light border-end-0 text-muted"
                                                style="border-color: rgba(116, 40, 20, 0.2);">Rp</span>
                                            <input type="number" class="form-control border-start-0 ps-0" id="amount"
                                                placeholder="0">
                                        </div>
                                    </div>

                                    <!-- Deskripsi -->
                                    <div class="col-12">
                                        <label class="form-label" for="description">Deskripsi Transaksi</label>
                                        <textarea class="form-control" id="description" rows="3"
                                            placeholder="Jelaskan detail transaksi ini..."></textarea>
                                    </div>

                                </div>
                            </div>

                            <!-- Right Column: Receipt Upload -->
                            <div class="col-lg-5">
                                <div class="d-flex flex-column h-100">
                                    <label class="form-label">Bukti Transaksi (Opsional)</label>
                                    <div class="image-upload-area flex-grow-1">
                                        <span class="material-symbols-outlined text-primary-custom mb-2"
                                            style="font-size: 2.5rem;">receipt</span>
                                        <p class="fw-semibold text-dark mb-1" style="font-size: 0.875rem;">Unggah struk
                                            atau nota</p>
                                        <p class="text-muted small mb-0" style="font-size: 0.75rem;">Format JPG, PNG
                                            atau PDF</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                <!-- Action Buttons -->
                <div class="p-4 border-top bg-light bg-opacity-50 d-flex justify-content-end gap-3 align-items-center"
                    style="border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;">
                    <a href="keuangan.php" class="btn btn-light border fw-semibold px-4 text-dark">
                        Batal
                    </a>
                    <button type="button"
                        class="btn btn-primary-custom fw-semibold px-4 d-flex align-items-center gap-2"
                        id="btnSimpanTransaksi">
                        <span class="material-symbols-outlined fs-6">save</span>
                        Simpan Transaksi
                    </button>
                </div>
            </div>
        </div>

    </main>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/admin.js"></script>
    <script src="../js/admin-keuangan.js"></script>
</body>

</html>

