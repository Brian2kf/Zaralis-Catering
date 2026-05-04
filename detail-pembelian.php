<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';
require_once __DIR__ . '/helpers/admin_middleware.php';
session_init();
require_login();
redirect_admin_from_public();
?><!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Pembelian - Zarali's Catering</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap"
        rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
</head>

<body class="d-flex flex-column min-vh-100" style="background-color: #FFF8F0;">

    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Main Content -->
    <main class="container py-5 flex-grow-1">

        <!-- Header Section -->
        <div
            class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
            <div class="d-flex align-items-center gap-3">
                <a href="pembelian.php" class="btn btn-sm btn-light border p-1 d-flex align-items-center text-muted"
                    title="Kembali">
                    <span class="material-symbols-outlined fs-6">arrow_back</span>
                </a>
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <h2 class="display-6 fw-bold text-dark tracking-tight mb-0"
                            style="font-family: 'Outfit', sans-serif;" id="orderNumber">#CTR-00000000-000</h2>
                        <div id="orderStatusBadge">
                            <span class="badge rounded-pill badge-soft-warning px-3 py-1 mt-1">Memuat...</span>
                        </div>
                    </div>
                    <p class="text-muted mb-0 fs-6" id="orderDate">Dipesan pada: -</p>
                </div>
            </div>

        </div>

        <div class="row g-4">

            <!-- Left Column: Order Details -->
            <div class="col-lg-8">

                <!-- Order Items -->
                <div class="content-card mb-4 p-0 overflow-hidden">
                    <div class="p-4 border-bottom bg-light bg-opacity-50">
                        <h3 class="section-title mb-0 fs-5">
                            <span class="material-symbols-outlined text-primary-custom">restaurant</span>
                            Rincian Pesanan
                        </h3>
                    </div>
                    <div class="p-0 table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="py-3 px-4 text-muted small fw-semibold border-bottom-0">Item</th>
                                    <th class="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-center">Harga
                                    </th>
                                    <th class="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-center">Qty
                                    </th>
                                    <th class="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-end">Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="border-top-0" id="orderItemsTable">
                                <tr>
                                    <td colspan="4" class="p-4 text-center text-muted">Memuat item pesanan...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Subtotals -->
                    <div class="p-4 border-top bg-light bg-opacity-50">
                        <div class="d-flex justify-content-end">
                            <div style="width: 300px;">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Subtotal</span>
                                    <span class="fw-medium text-dark" id="subtotalText">Rp 0</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Biaya Pengiriman</span>
                                    <span class="fw-medium text-dark" id="shippingCostText">Rp 0</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fs-6 fw-bold text-dark">Total Akhir</span>
                                    <span class="fs-4 fw-bold text-primary-custom"
                                        style="font-family: 'Outfit', sans-serif;" id="totalAmountText">Rp 0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right Column: Customer & Payment Info -->
            <div class="col-lg-4 d-flex flex-column gap-4">

                <!-- Customer Info -->
                <div class="content-card p-4">
                    <h3 class="section-title mb-4 fs-5">
                        <span class="material-symbols-outlined text-primary-custom">person</span>
                        Informasi Pelanggan
                    </h3>

                    <div class="d-flex flex-column gap-3">
                        <div>
                            <span class="small text-muted d-block mb-1">Nama Pemesan</span>
                            <span class="fw-semibold text-dark" id="customerName">-</span>
                        </div>
                        <hr class="my-0 opacity-25">
                        <div>
                            <span class="small text-muted d-block mb-1">Email</span>
                            <span class="fw-medium text-dark" id="customerEmail">-</span>
                        </div>
                        <hr class="my-0 opacity-25">
                        <div>
                            <span class="small text-muted d-block mb-1">No. HP / WhatsApp</span>
                            <span class="fw-medium text-dark" id="customerPhone">-</span>
                        </div>
                    </div>
                </div>

                <!-- Delivery Info -->
                <div class="content-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="section-title mb-0 fs-5">
                            <span class="material-symbols-outlined text-primary-custom">local_shipping</span>
                            Pengiriman
                        </h3>
                        <span class="badge rounded-pill bg-light text-dark border">Kurir Internal</span>
                    </div>

                    <div class="d-flex flex-column gap-3">
                        <div>
                            <span class="small text-muted d-block mb-1">Jadwal Kirim</span>
                            <span class="fw-semibold text-dark" id="deliverySchedule">-</span>
                        </div>
                        <div>
                            <span class="small text-muted d-block mb-1">Alamat Tujuan</span>
                            <span class="fw-medium text-dark d-block" id="deliveryAddress">-</span>
                        </div>
                        <div class="p-3 bg-light rounded-3 mt-2 border border-light">
                            <span class="small text-muted d-block mb-1 fw-bold">Catatan Pelanggan:</span>
                            <p class="small text-dark mb-0 fst-italic" id="customerNotes">"-"</p>
                        </div>
                    </div>
                </div>

                <!-- Payment Info -->
                <div class="content-card p-4">
                    <h3 class="section-title mb-4 fs-5">
                        <span class="material-symbols-outlined text-primary-custom">payments</span>
                        Informasi Pembayaran
                    </h3>

                    <div class="d-flex flex-column gap-3">
                        <div>
                            <span class="small text-muted d-block mb-1">Metode Pembayaran</span>
                            <span class="fw-semibold text-dark" id="paymentMethod">Transfer Bank</span>
                        </div>
                        <div>
                            <span class="small text-muted d-block mb-2">Bukti Transfer</span>
                            <!-- Bukti Transfer Container -->
                            <div id="paymentProofContainer">
                                <div class="border rounded-3 p-4 text-center bg-light">
                                    <span class="material-symbols-outlined text-muted fs-1 mb-2">image_not_supported</span>
                                    <p class="small text-muted fw-medium mb-0">Belum ada bukti upload</p>
                                </div>
                            </div>
                        </div>
                    </div>
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
    <script src="js/load-components.js"></script>
    <script src="js/detail-pembelian.js"></script>
</body>

</html>


