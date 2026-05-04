<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cek Status Pesanan - Zarali's Catering</title>
    <meta name="description" content="Lacak status pesanan jajan pasar dan catering Anda secara real-time menggunakan nomor order dan email atau nomor HP.">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
    <link rel="stylesheet" href="css/pages/track-order.css">
    <style>
        /* Status badge variants */
        .status-badge-pending_payment     { background-color: rgba(255, 193,  7, 0.15); color: #856404; }
        .status-badge-pending_verification{ background-color: rgba(  13, 110,253, 0.12); color: #0a3a8c; }
        .status-badge-processing          { background-color: rgba( 45, 106, 79, 0.15); color: #1B4332; }
        .status-badge-shipped             { background-color: rgba(  0, 186,230, 0.15); color: #006070; }
        .status-badge-completed           { background-color: rgba( 25, 135, 84, 0.15); color: #0a4027; }
        .status-badge-cancelled           { background-color: rgba(220,  53, 69, 0.15); color: #842029; }

        /* Items section inside timeline card */
        .items-divider { border-top: 1px dashed rgba(0,0,0,0.1); margin: 1.5rem 0; }

        /* Subtle transition for result section */
        #tracking-result-section { transition: opacity 0.4s ease, transform 0.4s ease; }
    </style>
</head>
<body class="d-flex flex-column min-vh-100">
    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Main Content -->
    <main class="container py-5 flex-grow-1">

        <!-- Header Section -->
        <header class="mb-5">
            <h1 class="display-5 fw-bold text-dark mb-3 d-flex align-items-center gap-2" style="font-family: 'Outfit', sans-serif;">
                <span class="material-symbols-outlined fs-1">search</span>
                Cek Status Pesanan
            </h1>
            <p class="fs-5 text-muted" style="max-width: 600px;">
                Pantau proses pesanan jajan pasar dan catering Anda dengan memasukkan detail di bawah ini.
            </p>
        </header>

        <!-- Search Form Card -->
        <div class="row g-4">
            <div class="col-lg-5">
                <div class="track-card p-4">
                    <h2 class="h4 fw-bold mb-4" style="font-family: 'Outfit', sans-serif;">Cari Pesanan</h2>
                    <form id="form-track-order" novalidate>
                        <div class="mb-3">
                            <label for="input-order-number" class="form-label small fw-bold text-muted mb-1">No. Order</label>
                            <input
                                type="text"
                                id="input-order-number"
                                class="form-control"
                                placeholder="Contoh: CTR-20260501-0001"
                                autocomplete="off"
                                spellcheck="false"
                            >
                        </div>
                        <div class="mb-4">
                            <label for="input-identifier" class="form-label small fw-bold text-muted mb-1">Email atau Nomor HP</label>
                            <input
                                type="text"
                                id="input-identifier"
                                class="form-control"
                                placeholder="Email atau 0812..."
                                autocomplete="off"
                            >
                            <div class="form-text text-muted mt-1">
                                <span class="material-symbols-outlined" style="font-size:0.85rem;vertical-align:middle;">shield</span>
                                Digunakan untuk memverifikasi kepemilikan pesanan.
                            </div>
                        </div>
                        <button
                            type="button"
                            id="btn-track-order"
                            class="btn btn-primary-custom w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                        >
                            <span id="btn-track-loading" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <span id="btn-track-text" class="d-flex align-items-center gap-2">
                                <span class="material-symbols-outlined fs-6">manage_search</span>
                                Lacak Pesanan
                            </span>
                        </button>
                    </form>

                    <!-- Alert Area -->
                    <div id="track-alert-area" class="d-none mt-3"></div>
                </div>
            </div>
        </div>

        <!-- ════════════════════════════════════════════════
             Tracking Result Section (dinamis via JS)
             ════════════════════════════════════════════════ -->
        <div id="tracking-result-section" class="d-none mt-5">
            <div class="row g-5">

                <!-- Left Column: Summary Card -->
                <div class="col-lg-5">
                    <div class="summary-card p-4 position-relative overflow-hidden h-100">
                        <!-- Decorative circle -->
                        <div class="position-absolute top-0 end-0 rounded-circle"
                             style="width:150px;height:150px;background-color:rgba(45,106,79,0.05);margin-right:-50px;margin-top:-50px;"></div>

                        <h3 class="small fw-bold text-muted text-uppercase tracking-wider mb-3">Detail Ringkas</h3>

                        <div class="d-flex flex-column gap-3">
                            <!-- Order ID -->
                            <div class="d-flex justify-content-between align-items-start border-bottom pb-3">
                                <span class="text-muted small">Order ID</span>
                                <span id="summary-order-number" class="fw-bold text-dark fs-5 text-end">—</span>
                            </div>

                            <!-- Status -->
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-3">
                                <span class="text-muted small">Status</span>
                                <span id="summary-status-badge" class="badge rounded-pill px-3 py-2 d-flex align-items-center gap-1">—</span>
                            </div>

                            <!-- Estimasi Pengiriman -->
                            <div class="d-flex justify-content-between align-items-start border-bottom pb-3">
                                <span class="text-muted small">Jadwal Antar</span>
                                <span id="summary-delivery" class="fw-medium text-dark text-end" style="max-width:200px;">—</span>
                            </div>

                            <!-- Total -->
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-3">
                                <span class="text-muted small">Total Pembayaran</span>
                                <span id="summary-total" class="fw-bold text-primary-custom">—</span>
                            </div>

                            <!-- Alamat -->
                            <div class="d-flex justify-content-between align-items-start border-bottom pb-3">
                                <span class="text-muted small">Alamat Antar</span>
                                <span id="summary-address" class="text-dark text-end small" style="max-width:220px;">—</span>
                            </div>

                            <!-- Bukti Bayar -->
                            <div id="summary-payment-row" class="d-flex justify-content-between align-items-center border-bottom pb-3 d-none">
                                <span class="text-muted small">Bukti Bayar</span>
                                <span id="summary-payment-status" class="small fw-medium">—</span>
                            </div>

                            <!-- Catatan Pesanan -->
                            <div id="summary-notes-row" class="d-none">
                                <span class="text-muted small d-block mb-1">Catatan</span>
                                <span id="summary-notes" class="small text-dark fst-italic">—</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Timeline + Items Card -->
                <div class="col-lg-7">
                    <div class="timeline-card p-4 p-md-5 position-relative overflow-hidden">
                        <span class="material-symbols-outlined truck-bg">local_shipping</span>

                        <h2 class="h3 fw-bold mb-5 pb-3 border-bottom position-relative z-1" style="font-family: 'Outfit', sans-serif;">
                            Perjalanan Pesanan
                        </h2>

                        <!-- Timeline Container (diisi oleh JS) -->
                        <div class="timeline-container position-relative">
                            <!-- Background Line -->
                            <div class="timeline-line"></div>
                            <!-- Progress Line (height diset oleh JS) -->
                            <div id="timeline-progress" class="timeline-progress" style="height:0%"></div>

                            <!-- Steps dinamis -->
                            <div id="timeline-container"></div>
                        </div>

                        <!-- Divider -->
                        <div class="items-divider"></div>

                        <!-- Item Pesanan -->
                        <h2 class="h5 fw-bold mb-4" style="font-family: 'Outfit', sans-serif;">
                            <span class="material-symbols-outlined align-middle me-1" style="font-size:1.2rem;">shopping_basket</span>
                            Item Pesanan
                        </h2>
                        <div id="items-section">
                            <!-- Diisi oleh JS -->
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <!-- End Result Section -->

    </main>

    <!-- Footer Placeholder -->
    <div id="footer-placeholder"></div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/load-components.js"></script>
    <script src="js/track-order.js"></script>
</body>
</html>
