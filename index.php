<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';
require_once __DIR__ . '/helpers/admin_middleware.php';
session_init();

// Redirect admin dari halaman publik (Poin 1 & 2B)
redirect_admin_from_public();
?><!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zarali's Catering</title>
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

<body>
    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="container hero-content py-5">
            <div class="row">
                <div class="col-lg-8 col-md-10">
                    <h1 class="display-4 fw-bold text-primary-custom mb-3 lh-sm">Kue Tradisional untuk Setiap Momen
                        Spesial Anda</h1>
                    <p class="fs-5 mb-4" style="color: #4a3f35;">Hadirkan kehangatan tradisi dalam setiap gigitan.
                        Dibuat dengan resep warisan keluarga untuk menyempurnakan acara istimewa Anda.</p>
                    <div class="d-flex gap-3 flex-wrap">
                        <a href="menu.html"
                            class="btn btn-primary-custom rounded-pill px-4 py-2 fw-semibold shadow-sm">Lihat Menu</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Delivery Area Notice -->
    <div class="container" style="margin-top: -28px; position: relative; z-index: 5;">
        <div class="d-flex align-items-center justify-content-center gap-2 py-3 px-4 rounded-pill mx-auto shadow-sm"
            style="max-width: 520px; background-color: #2D6A4F; color: white;">
            <span class="material-symbols-outlined" style="font-size: 20px;">local_shipping</span>
            <span class="fw-medium small">Saat ini kami melayani pengiriman di area <strong>Kota Depok, Jawa
                    Barat</strong></span>
        </div>
    </div>

    <!-- Kenapa Zarali's Section -->
    <section class="py-5" style="background-color: #FDFBF7;">
        <div class="container py-4">
            <div class="text-center mb-5">
                <h2 class="fw-bold mb-2">Kenapa Zarali's?</h2>
                <p class="text-muted">Komitmen kami untuk memberikan yang terbaik</p>
            </div>

            <div class="row g-4">
                <!-- Resep Autentik -->
                <div class="col-md-8">
                    <div class="bento-card" style="background-color: #E9F5F0; border: 1px solid #D1E8DD;">
                        <div class="bento-icon" style="background-color: rgba(45, 106, 79, 0.1); color: #2D6A4F;">
                            <span class="material-symbols-outlined"
                                style="font-variation-settings: 'FILL' 1;">restaurant_menu</span>
                        </div>
                        <h3 class="h4 fw-bold mb-2">Resep Autentik</h3>
                        <p class="text-muted mb-0">Cita rasa asli dari resep turun-temurun yang terjaga kualitasnya,
                            membawa kenangan manis di setiap gigitan.</p>
                    </div>
                </div>
                <!-- Antar Cepat -->
                <div class="col-md-4">
                    <div class="bento-card" style="background-color: #FFF4E6; border: 1px solid #FFE4C4;">
                        <div class="bento-icon" style="background-color: rgba(232, 93, 4, 0.1); color: #E85D04;">
                            <span class="material-symbols-outlined"
                                style="font-variation-settings: 'FILL' 1;">local_shipping</span>
                        </div>
                        <h3 class="h5 fw-bold mb-2">Antar Cepat</h3>
                        <p class="text-muted mb-0 small">Pengiriman tepat waktu untuk memastikan kesegaran kue Anda.</p>
                    </div>
                </div>
                <!-- Kualitas Terjamin -->
                <div class="col-md-4">
                    <div class="bento-card" style="background-color: #F0F4F8; border: 1px solid #D9E2EC;">
                        <div class="bento-icon" style="background-color: rgba(30, 58, 138, 0.1); color: #1E3A8A;">
                            <span class="material-symbols-outlined"
                                style="font-variation-settings: 'FILL' 1;">verified</span>
                        </div>
                        <h3 class="h5 fw-bold mb-2">Kualitas Terjamin</h3>
                        <p class="text-muted mb-0 small">Bahan-bahan premium pilihan untuk rasa yang tak tertandingi.
                        </p>
                    </div>
                </div>
                <!-- Harga Terjangkau -->
                <div class="col-md-8">
                    <div class="bento-card d-flex align-items-center gap-4"
                        style="background-color: #FDE8E8; border: 1px solid #FBCFE8;">
                        <div class="bento-icon mb-0 flex-shrink-0"
                            style="background-color: rgba(155, 28, 28, 0.1); color: #9B1C1C; width: 64px; height: 64px;">
                            <span class="material-symbols-outlined fs-2"
                                style="font-variation-settings: 'FILL' 1;">payments</span>
                        </div>
                        <div>
                            <h3 class="h5 fw-bold mb-2">Harga Terjangkau</h3>
                            <p class="text-muted mb-0 small">Kualitas premium dengan harga yang bersahabat untuk semua
                                kalangan, tanpa kompromi pada rasa.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Menu Populer Section -->
    <section class="py-5">
        <div class="container py-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
                <div>
                    <h2 class="fw-bold mb-2">Menu Populer</h2>
                    <p class="text-muted mb-0">Pilihan favorit pelanggan setia kami</p>
                </div>
                <a href="menu.html"
                    class="text-primary-custom fw-bold text-decoration-none d-flex align-items-center gap-1 mt-3 mt-md-0 nav-link-custom">
                    Lihat Semua Menu
                    <span class="material-symbols-outlined fs-6">arrow_forward</span>
                </a>
            </div>

            <div class="row g-4">
                <!-- Card 1 -->
                <div class="col-xl-3 col-lg-4 col-md-6 product-card">
                    <div class="h-100 d-flex flex-column">
                        <div class="product-img-wrapper position-relative">
                            <img src="assets/images/KUE TAMPAH UKURAN SEDANG.jpg" alt="KUE TAMPAH UKURAN SEDANG"
                                onerror="this.src='assets/images/KUE TAMPAH UKURAN SEDANG.jpg'">
                            <span class="badge position-absolute top-0 end-0 m-3 px-2 py-1"
                                style="background-color: #E85D04;">Populer</span>
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1 border border-top-0 rounded-bottom">
                            <h3 class="h5 fw-bold mb-2">KUE TAMPAH UKURAN SEDANG</h3>
                            <p class="text-muted small mb-3 flex-grow-1">Berbagai macam kue campuran</p>
                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span class="text-secondary-custom fw-bold">Rp 350.000</span>
                                <button
                                    class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center add-to-cart-btn border-0 text-primary-custom bg-light"
                                    title="Masukkan ke Keranjang">
                                    <span class="material-symbols-outlined fs-6">add_shopping_cart</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="col-xl-3 col-lg-4 col-md-6 product-card">
                    <div class="h-100 d-flex flex-column">
                        <div class="product-img-wrapper position-relative">
                            <img src="assets/images/KUE TAMPAH UKURAN BESAR.jpg" alt="KUE NAMPAN UKURAN BESAR"
                                onerror="this.src='assets/images/KUE TAMPAH UKURAN BESAR.jpg'">
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1 border border-top-0 rounded-bottom">
                            <h3 class="h5 fw-bold mb-2">KUE NAMPAN UKURAN BESAR</h3>
                            <p class="text-muted small mb-3 flex-grow-1">Kue dengan berbagai macam aneka rasa...</p>
                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span class="text-secondary-custom fw-bold">Rp 130.000</span>
                                <button
                                    class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center add-to-cart-btn border-0 text-primary-custom bg-light"
                                    title="Masukkan ke Keranjang">
                                    <span class="material-symbols-outlined fs-6">add_shopping_cart</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card 3 -->
                <div class="col-xl-3 col-lg-4 col-md-6 product-card">
                    <div class="h-100 d-flex flex-column">
                        <div class="product-img-wrapper position-relative">
                            <img src="assets/images/PUDING TELUR CEPLOK.jpg" alt="PUDING TELUR CEPLOK">
                            <span class="badge position-absolute top-0 end-0 m-3 px-2 py-1"
                                style="background-color: #1E3A8A;">Baru</span>
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1 border border-top-0 rounded-bottom">
                            <h3 class="h5 fw-bold mb-2">PUDING TELUR CEPLOK</h3>
                            <p class="text-muted small mb-3 flex-grow-1">Puding dengan berbentuk telur ceplok dari...
                            </p>
                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span class="text-secondary-custom fw-bold">Rp 3.000 <span
                                        class="text-muted fw-normal small">/ pcs</span></span>
                                <button
                                    class="btn btn-sm btn-outline-primary-custom rounded-pill px-3 py-1 fw-medium add-to-paket-btn">
                                    + Paket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card 4 -->
                <div class="col-xl-3 col-lg-4 col-md-6 product-card">
                    <div class="h-100 d-flex flex-column">
                        <div class="product-img-wrapper position-relative">
                            <img src="assets/images/KLEPON.jpg" alt="KLEPON">
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1 border border-top-0 rounded-bottom">
                            <h3 class="h5 fw-bold mb-2">KLEPON</h3>
                            <p class="text-muted small mb-3 flex-grow-1">Tepung ketan dengan isian gula merah...</p>
                            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span class="text-secondary-custom fw-bold">Rp 3.000 <span
                                        class="text-muted fw-normal small">/ pcs</span></span>
                                <button
                                    class="btn btn-sm btn-outline-primary-custom rounded-pill px-3 py-1 fw-medium add-to-paket-btn">
                                    + Paket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Cara Pesan Section -->
    <section class="py-5" style="background-color: #FDFBF7;">
        <div class="container py-4 text-center">
            <h2 class="fw-bold mb-2">Cara Pesan</h2>
            <p class="text-muted mb-5">Proses pemesanan mudah dalam 4 langkah</p>

            <div class="row position-relative">
                <div class="col-12 d-none d-md-block position-absolute"
                    style="top: 40px; left: 0; right: 0; z-index: 1;">
                    <div style="height: 2px; background-color: #dee2e6; width: 75%; margin: 0 auto;"></div>
                </div>

                <div class="col-md-3 mb-4 mb-md-0 position-relative" style="z-index: 2;">
                    <div class="step-circle bg-primary-custom text-white shadow-sm" style="border: 4px solid white;">1
                    </div>
                    <h4 class="h5 fw-bold mb-1">Pilih Menu</h4>
                    <p class="text-muted small mx-auto" style="max-width: 180px;">Eksplorasi ragam pilihan kue kami.</p>
                </div>
                <div class="col-md-3 mb-4 mb-md-0 position-relative" style="z-index: 2;">
                    <div class="step-circle bg-white text-primary-custom shadow-sm"
                        style="border: 4px solid #2D6A4F; outline: 4px solid white; outline-offset: -4px; box-shadow: 0 0 0 4px white inset;">
                        2</div>
                    <h4 class="h5 fw-bold mb-1">Checkout</h4>
                    <p class="text-muted small mx-auto" style="max-width: 180px;">Tentukan tanggal & alamat pengiriman.
                    </p>
                </div>
                <div class="col-md-3 mb-4 mb-md-0 position-relative" style="z-index: 2;">
                    <div class="step-circle bg-white text-primary-custom shadow-sm"
                        style="border: 4px solid #2D6A4F; outline: 4px solid white; outline-offset: -4px; box-shadow: 0 0 0 4px white inset;">
                        3</div>
                    <h4 class="h5 fw-bold mb-1">Bayar</h4>
                    <p class="text-muted small mx-auto" style="max-width: 180px;">Selesaikan pembayaran pesanan Anda.
                    </p>
                </div>
                <div class="col-md-3 position-relative" style="z-index: 2;">
                    <div class="step-circle text-white shadow-sm"
                        style="background-color: #E07A5F; border: 4px solid white;">4</div>
                    <h4 class="h5 fw-bold mb-1">Terima</h4>
                    <p class="text-muted small mx-auto" style="max-width: 180px;">Nikmati kue lezat di hari spesial.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-5 mb-4">
        <div class="container">
            <div class="cta-section text-center shadow-lg">
                <h2 class="display-6 fw-bold mb-3 position-relative z-1" style="font-family: 'Outfit', sans-serif;">
                    Pesan Kue Favorit Anda Sekarang!</h2>
                <p class="fs-5 mb-4 position-relative z-1 mx-auto"
                    style="color: rgba(255,255,255,0.9); max-width: 600px;">Jadikan momen Anda lebih berkesan dengan
                    hidangan manis yang dibuat dengan penuh cinta.</p>
                <a href="menu.html"
                    class="btn btn-secondary-custom btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm position-relative z-1 border-0">Mulai
                    Pesan</a>
            </div>
        </div>
    </section>

    <!-- Add to Package Modal -->
    <div class="modal fade" id="addToPackageModal" tabindex="-1" aria-labelledby="addToPackageModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-light border-0 pb-0">
                    <h5 class="modal-title fw-bold text-dark" id="addToPackageModalLabel">Masukkan ke Paket</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
                        <img src="" id="modalProductImage" alt="Product" class="rounded"
                            style="width: 60px; height: 60px; object-fit: cover;">
                        <div>
                            <h6 class="fw-bold mb-1" id="modalProductName">Nama Produk</h6>
                            <span class="text-secondary-custom fw-bold" id="modalProductPrice">Rp 0</span>
                        </div>
                    </div>

                    <h6 class="fw-bold mb-3">Pilih Paket Anda:</h6>
                    <div id="packageListContainer" class="d-flex flex-column gap-2 mb-4 max-h-50 overflow-auto">
                        <!-- Package List Item will be rendered here via JS -->
                    </div>

                    <div class="border-top pt-3">
                        <h6 class="fw-bold mb-2">Atau Buat Paket Baru</h6>
                        <div class="input-group mb-2">
                            <input type="text" class="form-control" id="newPackageName"
                                placeholder="Contoh: Paket Lebaran Mama">
                            <button class="btn btn-primary-custom" id="createNewPackageBtn">Buat & Masukkan</button>
                        </div>
                        <small class="text-muted d-block mt-2">
                            <em>Aturan: 1 paket minimal berisi 3 kue. Anda harus membuat minimal 10 paket untuk
                                checkout.</em>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer Placeholder -->
    <div id="footer-placeholder"></div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/load-components.js"></script>
</body>

</html>
