<?php
// product-detail.php
// Halaman detail produk — data dimuat dinamis via JS
// Bisa diakses oleh semua user (termasuk guest)
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/session.php';
session_init();
$is_logged_in = is_logged_in();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Produk - Zarali's Catering</title>
    <meta name="description" content="Lihat detail, gambar, komposisi, dan ulasan pelanggan untuk produk pilihan Zarali's Catering.">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/custom.css">
    <style>
        /* ===== Gallery ===== */
        .product-gallery-main {
            width: 100%;
            height: 420px;
            object-fit: cover;
            border-radius: 1rem;
            border: 1px solid rgba(0,0,0,0.06);
            transition: opacity 0.2s;
        }
        .product-gallery-thumb {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 0.5rem;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .product-gallery-thumb:hover { opacity: 0.8; }
        .product-gallery-thumb.active { border-color: #2D6A4F; }

        /* ===== Qty ===== */
        .qty-input { width: 60px; text-align: center; }
        .qty-btn {
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 0.5rem;
            background-color: #f8faf6;
            border: 1px solid rgba(0,0,0,0.1);
            color: #191c1a;
            transition: all 0.2s;
        }
        .qty-btn:hover { background-color: #e7e9e5; }

        /* ===== Star Rating Input ===== */
        .star-rating { display: flex; gap: 4px; }
        .star-rating .star-btn {
            background: none; border: none; padding: 0; cursor: pointer;
            color: #d1d5db; font-size: 1.5rem; transition: color 0.15s;
        }
        .star-rating .star-btn.active,
        .star-rating .star-btn:hover,
        .star-rating .star-btn.hovered { color: #f59e0b; }

        /* ===== Review Cards ===== */
        .review-card {
            background: #fff;
            border: 1px solid rgba(0,0,0,0.07);
            border-radius: 0.75rem;
            padding: 1.25rem;
            transition: box-shadow 0.2s;
        }
        .review-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .review-stars .material-symbols-outlined {
            font-size: 1rem;
            font-variation-settings: 'FILL' 1;
        }
        .review-stars .filled  { color: #f59e0b; }
        .review-stars .unfilled { color: #d1d5db; }

        /* ===== Skeleton Loading ===== */
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
            border-radius: 0.4rem;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ===== Accordion ===== */
        .accordion-button:not(.collapsed) { color: #2D6A4F; box-shadow: none; }
        .accordion-button:focus { box-shadow: none; }

        /* ===== Page loading overlay ===== */
        #page-loader {
            position: fixed; inset: 0;
            background: rgba(255,255,255,0.85);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s;
        }
    </style>
</head>
<body class="d-flex flex-column min-vh-100" style="background-color: #FAFAF8;">

    <!-- Page Loader -->
    <div id="page-loader">
        <div class="spinner-border text-primary-custom" role="status">
            <span class="visually-hidden">Memuat...</span>
        </div>
    </div>

    <!-- Navbar Placeholder -->
    <div id="navbar-placeholder"></div>

    <!-- Main Content -->
    <main class="container py-5 flex-grow-1">

        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.php" class="text-decoration-none text-muted">Beranda</a></li>
                <li class="breadcrumb-item"><a href="menu.html" class="text-decoration-none text-muted">Menu</a></li>
                <li class="breadcrumb-item active text-dark fw-medium" aria-current="page" id="breadcrumb-name">Memuat...</li>
            </ol>
        </nav>

        <!-- Product Not Found Alert (hidden by default) -->
        <div id="product-not-found" class="d-none">
            <div class="text-center py-5">
                <span class="material-symbols-outlined text-muted" style="font-size: 4rem;">search_off</span>
                <h2 class="h4 mt-3 text-dark">Produk Tidak Ditemukan</h2>
                <p class="text-muted">Produk yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
                <a href="menu.html" class="btn btn-primary-custom">Kembali ke Menu</a>
            </div>
        </div>

        <!-- Product Detail Content -->
        <div id="product-content" class="d-none">
            <div class="row g-5">

                <!-- Kiri: Galeri Gambar -->
                <div class="col-lg-6">
                    <div class="d-flex flex-column gap-3">
                        <img src="" alt="Gambar Produk" class="product-gallery-main shadow-sm" id="mainImage">
                        <!-- Thumbnail strip — ditampilkan hanya jika ada lebih dari 1 gambar -->
                        <div id="thumbnail-strip" class="d-flex gap-2 overflow-auto pb-2 no-scrollbar d-none"></div>
                    </div>
                </div>

                <!-- Kanan: Info Produk -->
                <div class="col-lg-6">
                    <div class="d-flex flex-column h-100">

                        <!-- Badge Kategori -->
                        <div class="mb-2" id="category-badge"></div>

                        <!-- Nama Produk -->
                        <h1 class="display-5 fw-bold text-dark mb-2" style="font-family: 'Outfit', sans-serif;" id="product-name">-</h1>

                        <!-- Rating -->
                        <div class="d-flex align-items-center gap-2 mb-4" id="rating-section">
                            <div class="d-flex text-warning" id="stars-display"></div>
                            <span class="text-muted small" id="rating-text">Belum ada ulasan</span>
                        </div>

                        <!-- Harga -->
                        <h2 class="h2 fw-bold mb-4" style="color: #2D6A4F;" id="price-display">-</h2>

                        <!-- Deskripsi -->
                        <p class="text-muted mb-4" style="line-height: 1.7;" id="product-description">-</p>

                        <!-- Aksi (Tombol kondisional berdasarkan kategori) -->
                        <div class="border-top pt-4 mb-4" id="action-section"></div>

                        <!-- Accordion Detail -->
                        <div class="accordion mt-auto" id="productAccordion">
                            <div class="accordion-item border-0 border-bottom">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed bg-transparent px-0 fw-semibold text-dark shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDurability">
                                        Daya Tahan &amp; Penyimpanan
                                    </button>
                                </h2>
                                <div id="collapseDurability" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                                    <div class="accordion-body px-0 text-muted small">
                                        Sangat disarankan untuk dikonsumsi di hari yang sama. Simpan di tempat sejuk dan terhindar dari sinar matahari langsung.
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- ===== Seksi Ulasan Pelanggan ===== -->
            <div class="mt-5 pt-4 border-top" id="reviews-section">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="h4 fw-bold text-dark mb-0" style="font-family: 'Outfit', sans-serif;">
                        <span class="material-symbols-outlined align-middle me-2 text-warning" style="font-variation-settings: 'FILL' 1;">star</span>
                        Ulasan Pelanggan
                    </h2>
                    <span class="badge bg-light text-muted border fw-normal" id="review-count-badge">0 ulasan</span>
                </div>

                <!-- Summary Rating -->
                <div id="rating-summary" class="mb-4 p-4 rounded-3 border" style="background: linear-gradient(135deg, #f8faf6, #ffffff);">
                    <div class="row align-items-center g-3">
                        <div class="col-auto text-center">
                            <div class="display-3 fw-bold" style="color: #2D6A4F; font-family: 'Outfit', sans-serif;" id="avg-rating-big">-</div>
                            <div class="d-flex justify-content-center mb-1" id="avg-stars-big"></div>
                            <div class="small text-muted" id="avg-review-label">-</div>
                        </div>
                    </div>
                </div>

                <!-- Review List -->
                <div id="reviews-container" class="d-flex flex-column gap-3">
                    <div class="text-center py-4 text-muted">
                        <span class="material-symbols-outlined fs-1 d-block mb-2">rate_review</span>
                        Belum ada ulasan untuk produk ini.
                    </div>
                </div>

                <!-- Tombol Lihat Semua -->
                <div class="text-center mt-4" id="load-more-reviews-wrapper" style="display: none !important;">
                    <button class="btn btn-outline-secondary rounded-pill px-4" id="btn-load-more-reviews">
                        <span class="material-symbols-outlined align-middle me-1">expand_more</span>
                        Lihat Semua Ulasan
                    </button>
                </div>
            </div>
        </div>
        <!-- END product-content -->

    </main>

    <!-- ===== Modal + Paket (identik dengan menu.html) ===== -->
    <div class="modal fade" id="addToPackageModal" tabindex="-1" aria-labelledby="addToPackageModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header bg-light border-0 pb-0">
                    <h5 class="modal-title fw-bold text-dark" id="addToPackageModalLabel">Masukkan ke Paket</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
                        <img src="" id="modalProductImage" alt="Product" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
                        <div>
                            <h6 class="fw-bold mb-1" id="modalProductName">Nama Produk</h6>
                            <span class="text-secondary-custom fw-bold" id="modalProductPrice">Rp 0</span>
                        </div>
                    </div>

                    <h6 class="fw-bold mb-3">Pilih Paket Anda:</h6>
                    <div id="packageListContainer" class="d-flex flex-column gap-2 mb-4 overflow-auto" style="max-height: 200px;">
                        <!-- Dirender oleh cart.js -->
                    </div>

                    <div class="border-top pt-3">
                        <h6 class="fw-bold mb-2">Atau Buat Paket Baru</h6>
                        <div class="input-group mb-2">
                            <input type="text" class="form-control" id="newPackageName" placeholder="Contoh: Paket Lebaran Mama">
                            <button class="btn btn-primary-custom" id="createNewPackageBtn">Buat &amp; Masukkan</button>
                        </div>
                        <small class="text-muted d-block mt-2">
                            <em>Aturan: 1 paket minimal berisi 3 kue. Anda harus membuat minimal 10 paket untuk checkout.</em>
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
    <script>
        // Kirim status login dari PHP ke JS agar product-detail.js bisa menggunakannya
        window.IS_LOGGED_IN = <?= $is_logged_in ? 'true' : 'false' ?>;
    </script>
    <script src="js/product-detail.js"></script>
    <script src="js/load-components.js"></script>
</body>
</html>
