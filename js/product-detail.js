// ============================================================
// js/product-detail.js
// Logic untuk halaman product-detail.php
// ============================================================

(function () {
    'use strict';

    // ── Helpers ──────────────────────────────────────────────
    const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function hideLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }

    function showNotFound() {
        document.getElementById('product-not-found')?.classList.remove('d-none');
        hideLoader();
    }

    // ── Render Bintang ────────────────────────────────────────
    // Mengembalikan HTML untuk bintang rating (display only)
    function renderStarsHTML(rating, size = '1.2rem') {
        let html = '';
        const filled = Math.floor(rating);
        const hasHalf = (rating - filled) >= 0.5;
        for (let i = 1; i <= 5; i++) {
            let icon = 'star';
            if (i <= filled) {
                icon = 'star';
            } else if (i === filled + 1 && hasHalf) {
                icon = 'star_half';
            } else {
                icon = 'star_outline';
            }
            const isActive = i <= filled || (i === filled + 1 && hasHalf);
            html += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${isActive ? 1 : 0}; font-size: ${size}; color: ${isActive ? '#f59e0b' : '#d1d5db'};">${icon}</span>`;
        }
        return html;
    }

    // ── Render Galeri ─────────────────────────────────────────
    function renderGallery(images) {
        const mainImg = document.getElementById('mainImage');
        const strip = document.getElementById('thumbnail-strip');
        if (!mainImg || !strip) return;

        const placeholder = 'assets/images/placeholder.png';
        const primaryImg = images.find(i => i.is_primary == 1) || images[0];
        const imgSrc = primaryImg ? primaryImg.file_path : placeholder;

        mainImg.src = imgSrc;
        mainImg.onerror = () => { mainImg.src = placeholder; };

        if (images.length > 1) {
            strip.innerHTML = '';
            strip.classList.remove('d-none');
            images.forEach((img, idx) => {
                const thumb = document.createElement('img');
                thumb.src = img.file_path;
                thumb.alt = `Gambar ${idx + 1}`;
                thumb.className = `product-gallery-thumb shadow-sm${img.is_primary == 1 ? ' active' : ''}`;
                thumb.onerror = () => { thumb.src = placeholder; };
                thumb.addEventListener('click', () => {
                    mainImg.src = img.file_path;
                    strip.querySelectorAll('.product-gallery-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                strip.appendChild(thumb);
            });
        }
    }

    // ── Render Tombol Aksi (kondisional) ──────────────────────
    function renderActionSection(product) {
        const section = document.getElementById('action-section');
        if (!section) return;

        if (product.category === 'kue_satuan') {
            section.innerHTML = `
                <h5 class="fw-semibold mb-3">Tambahkan ke Paket</h5>
                <p class="text-muted small mb-3">
                    <span class="material-symbols-outlined align-middle me-1" style="font-size:16px;color:#E07A5F;">info</span>
                    Kue satuan harus dimasukkan ke dalam paket (min. 3 jenis kue, min. 10 paket untuk checkout).
                </p>
                <button class="btn btn-primary-custom fw-bold py-3 px-5 d-flex align-items-center gap-2" id="btn-add-to-paket">
                    <span class="material-symbols-outlined">add_circle</span>
                    Paket
                </button>
            `;

            document.getElementById('btn-add-to-paket')?.addEventListener('click', () => {
                if (!window.cart) return;
                window.cart.selectedProductForPackage = {
                    id: product.name.toLowerCase().replace(/\s+/g, '-'),
                    dbId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    qty: 1,
                    image: product.images?.[0]?.file_path || 'assets/images/placeholder.png'
                };
                window.cart.openAddToPackageModal();
            });

        } else {
            // paket_besar — langsung tambah ke keranjang
            section.innerHTML = `
                <h5 class="fw-semibold mb-3">Pesan Sekarang</h5>
                <div class="d-flex align-items-center gap-3 flex-wrap mb-4">
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn qty-btn" id="qty-minus">
                            <span class="material-symbols-outlined fs-5">remove</span>
                        </button>
                        <input id="qty-input" type="number" class="form-control qty-input border-1" value="1" min="1" step="1">
                        <button class="btn qty-btn" id="qty-plus">
                            <span class="material-symbols-outlined fs-5">add</span>
                        </button>
                    </div>
                </div>
                <button class="btn btn-primary-custom fw-bold py-3 px-5 d-flex align-items-center gap-2" id="btn-add-to-cart">
                    <span class="material-symbols-outlined">shopping_cart</span>
                    Tambah ke Keranjang
                </button>
            `;

            const qtyInput = document.getElementById('qty-input');
            document.getElementById('qty-minus')?.addEventListener('click', () => {
                if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
            });
            document.getElementById('qty-plus')?.addEventListener('click', () => {
                qtyInput.value = parseInt(qtyInput.value) + 1;
            });

            document.getElementById('btn-add-to-cart')?.addEventListener('click', () => {
                if (!window.cart) return;
                const qty = parseInt(qtyInput.value) || 1;
                window.cart.addRegularItem({
                    id: product.name.toLowerCase().replace(/\s+/g, '-'),
                    dbId: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    qty: qty,
                    image: product.images?.[0]?.file_path || 'assets/images/placeholder.png'
                });
            });
        }
    }

    // ── Render Review Card ────────────────────────────────────
    function renderReviewCard(review) {
        const stars = renderStarsHTML(review.rating, '1rem');
        const date = new Date(review.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        return `
            <div class="review-card">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                             style="width:36px;height:36px;background:#2D6A4F;font-size:0.9rem;flex-shrink:0;">
                            ${review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-semibold text-dark small">${escapeHtml(review.reviewer_name)}</div>
                            <div class="text-muted" style="font-size:0.75rem;">${date}</div>
                        </div>
                    </div>
                    <div class="review-stars d-flex">${stars}</div>
                </div>
                ${review.comment ? `<p class="text-muted small mb-0 mt-2" style="line-height:1.6;">"${escapeHtml(review.comment)}"</p>` : ''}
            </div>
        `;
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    // ── Fetch & Render Reviews ────────────────────────────────
    let reviewTotal = 0;
    let reviewOffset = 0;
    const REVIEWS_PER_PAGE = 5;

    async function loadReviews(productId, append = false) {
        const container = document.getElementById('reviews-container');
        const loadMoreWrap = document.getElementById('load-more-reviews-wrapper');
        if (!container) return;

        try {
            const res = await fetch(`api/products/reviews.php?product_id=${productId}&limit=${REVIEWS_PER_PAGE}&offset=${reviewOffset}`);
            const data = await res.json();
            if (!data.success) return;

            reviewTotal = data.total;

            if (!append) {
                // Update summary badge
                const badge = document.getElementById('review-count-badge');
                if (badge) badge.textContent = `${reviewTotal} ulasan`;

                if (reviewTotal === 0) {
                    container.innerHTML = `
                        <div class="text-center py-4 text-muted">
                            <span class="material-symbols-outlined fs-1 d-block mb-2">rate_review</span>
                            Belum ada ulasan untuk produk ini.
                        </div>`;
                    if (loadMoreWrap) loadMoreWrap.style.setProperty('display', 'none', 'important');
                    return;
                }
                container.innerHTML = '';
            }

            data.reviews.forEach(r => {
                container.insertAdjacentHTML('beforeend', renderReviewCard(r));
            });

            reviewOffset += data.reviews.length;

            // Tampilkan / sembunyikan tombol "Lihat Semua"
            if (loadMoreWrap) {
                if (data.has_more) {
                    loadMoreWrap.style.removeProperty('display');
                } else {
                    loadMoreWrap.style.setProperty('display', 'none', 'important');
                }
            }
        } catch (e) {
            console.error('Gagal memuat ulasan:', e);
        }
    }

    // ── Fetch & Render Produk ─────────────────────────────────
    async function loadProduct(productId) {
        try {
            const res = await fetch(`api/products/show.php?id=${productId}`);
            if (!res.ok) { showNotFound(); return; }
            const product = await res.json();
            if (!product.id) { showNotFound(); return; }

            // Update <title>
            document.title = `${product.name} - Zarali's Catering`;

            // Breadcrumb
            const breadcrumb = document.getElementById('breadcrumb-name');
            if (breadcrumb) breadcrumb.textContent = product.name;

            // Badge kategori
            const badge = document.getElementById('category-badge');
            if (badge) {
                const isKueSatuan = product.category === 'kue_satuan';
                badge.innerHTML = `
                    <span class="badge" style="background-color: rgba(${isKueSatuan ? '224,122,95' : '45,106,79'}, 0.1);
                        color: ${isKueSatuan ? '#E07A5F' : '#2D6A4F'};
                        border: 1px solid rgba(${isKueSatuan ? '224,122,95' : '45,106,79'}, 0.25);">
                        ${isKueSatuan ? 'Kue Satuan' : 'Paket Besar'}
                    </span>`;
            }

            // Nama
            const nameEl = document.getElementById('product-name');
            if (nameEl) nameEl.textContent = product.name;

            // Rating
            const starsEl = document.getElementById('stars-display');
            const ratingEl = document.getElementById('rating-text');
            if (starsEl && ratingEl) {
                if (product.avg_rating) {
                    starsEl.innerHTML = renderStarsHTML(product.avg_rating);
                    ratingEl.textContent = `(${product.avg_rating} / ${product.review_count} ulasan)`;
                } else {
                    starsEl.innerHTML = renderStarsHTML(0);
                    ratingEl.textContent = 'Belum ada ulasan';
                }
            }

            // Harga
            const priceEl = document.getElementById('price-display');
            if (priceEl) {
                const label = product.category === 'kue_satuan' ? '<span class="text-muted fs-5 fw-normal"> / pcs</span>' : '';
                priceEl.innerHTML = `${formatRp(product.price)}${label}`;
            }

            // Deskripsi
            const descEl = document.getElementById('product-description');
            if (descEl) descEl.textContent = product.description || 'Deskripsi belum tersedia.';

            // Accordion bahan (gunakan deskripsi)
            const ingredientsEl = document.getElementById('accordion-ingredients');
            if (ingredientsEl && product.description) {
                ingredientsEl.textContent = product.description;
            }

            // Galeri
            renderGallery(product.images || []);

            // Tombol Aksi
            renderActionSection(product);

            // Rating Summary (seksi ulasan)
            const avgBig = document.getElementById('avg-rating-big');
            const starsBig = document.getElementById('avg-stars-big');
            const labelBig = document.getElementById('avg-review-label');
            if (avgBig && starsBig && labelBig) {
                if (product.avg_rating) {
                    avgBig.textContent = product.avg_rating.toFixed(1);
                    starsBig.innerHTML = renderStarsHTML(product.avg_rating, '1.1rem');
                    labelBig.textContent = `dari ${product.review_count} ulasan`;
                } else {
                    avgBig.textContent = '-';
                    starsBig.innerHTML = renderStarsHTML(0, '1.1rem');
                    labelBig.textContent = 'Belum ada ulasan';
                }
            }

            // Tampilkan konten
            document.getElementById('product-content')?.classList.remove('d-none');
            hideLoader();

            // Load reviews
            await loadReviews(productId);

            // Bind "Lihat Semua"
            document.getElementById('btn-load-more-reviews')?.addEventListener('click', () => {
                loadReviews(productId, true);
            });

        } catch (err) {
            console.error('Gagal memuat produk:', err);
            showNotFound();
        }
    }

    // ── Init ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const productId = getProductIdFromUrl();
        if (!productId) {
            showNotFound();
            return;
        }
        loadProduct(productId);
    });
})();
