// js/menu.js - Logika Fetch API dan Filter untuk halaman menu.html

const API_URL = 'api/products/index.php';

document.addEventListener("DOMContentLoaded", () => {
    loadMenu();
});

async function loadMenu() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Tampilkan produk ke masing-masing kontainer
        displayProducts(data.kue_satuan, 'kue-satuan-container', 'kue-satuan');
        displayProducts(data.paket_besar, 'paket-besar-container', 'paket-besar');

        // Inisialisasi logika filter dan search setelah data dimuat
        initFilterAndSearch();
        
        // Inisialisasi event listener untuk tombol keranjang/paket (jika ada di script lain)
        if (typeof initCartEvents === 'function') initCartEvents();
    } catch (error) {
        console.error('Gagal mengambil data menu:', error);
        const containers = ['kue-satuan-container', 'paket-besar-container'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div class="col-12 text-center text-danger py-4">Gagal memuat menu. Silakan coba lagi nanti.</div>';
        });
    }
}

function displayProducts(products, containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!products || products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-4">Belum ada produk untuk kategori ini.</div>';
        return;
    }

    products.forEach(product => {
        const isKueSatuan = category === 'kue-satuan';
        
        // Sesuaikan tombol berdasarkan kategori
        const buttonHTML = isKueSatuan 
            ? `<button class="btn btn-sm btn-outline-primary-custom rounded-pill px-3 py-1 fw-medium add-to-paket-btn" 
                data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
                + Paket
               </button>`
            : `<button class="btn btn-sm rounded-circle d-flex align-items-center justify-content-center add-to-cart-btn border-0 text-primary-custom bg-light" 
                title="Masukkan ke Keranjang" data-id="${product.id}">
                <span class="material-symbols-outlined fs-6">add_shopping_cart</span>
               </button>`;

        const badgeHTML = isKueSatuan 
            ? `<span class="badge position-absolute top-0 end-0 m-3 px-2 py-1" style="background-color: #E07A5F;">Kue Satuan</span>`
            : '';

        const priceLabel = isKueSatuan ? ' / pcs' : '';

        const productHTML = `
        <div class="col-xl-3 col-lg-4 col-md-6 product-item" data-category="${category}">
            <div class="product-card h-100 d-flex flex-column">
                <div class="product-img-wrapper position-relative">
                    <img src="${product.image || 'assets/images/placeholder.png'}" alt="${product.name}" onerror="this.src='assets/images/placeholder.png'">
                    ${badgeHTML}
                </div>
                <div class="p-3 d-flex flex-column flex-grow-1">
                    <h3 class="h5 fw-bold mb-2">${product.name.toUpperCase()}</h3>
                    <p class="text-muted small mb-3 flex-grow-1">${product.description || 'Tidak ada deskripsi.'}</p>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span class="text-secondary-custom fw-bold">Rp ${Number(product.price).toLocaleString('id-ID')} <span class="text-muted fw-normal small">${priceLabel}</span></span>
                        ${buttonHTML}
                    </div>
                </div>
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', productHTML);
    });
}

function initFilterAndSearch() {
    const searchInput = document.querySelector('input[placeholder="Cari sajian..."]');
    const filterBtns = document.querySelectorAll('.chip-btn');
    const productItems = document.querySelectorAll('.product-item');
    const sections = document.querySelectorAll('.product-section');

    // 1. Logika Pencarian
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            productItems.forEach(item => {
                const title = item.querySelector('h3').innerText.toLowerCase();
                const desc = item.querySelector('p').innerText.toLowerCase();

                if (title.includes(query) || desc.includes(query)) {
                    item.style.display = 'block';
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        if (item.style.opacity === '0') item.style.display = 'none';
                    }, 300);
                }
            });
        });
    }

    // 2. Logika Filter Kategori
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Style tombol aktif
                filterBtns.forEach(b => {
                    b.classList.remove('btn-primary-custom', 'border-0', 'text-white');
                    b.classList.add('btn-light', 'border', 'text-muted');
                });
                btn.classList.remove('btn-light', 'border', 'text-muted');
                btn.classList.add('btn-primary-custom', 'border-0', 'text-white');

                const targetCategory = btn.getAttribute('data-target');

                // Filter Seksi (Heading + Container)
                sections.forEach(section => {
                    const sectionId = section.getAttribute('id');
                    if (targetCategory === 'Semua' || sectionId === `section-${targetCategory}`) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });

                // Filter Item (Animasi)
                productItems.forEach(item => {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        if (targetCategory === 'Semua' || item.getAttribute('data-category') === targetCategory) {
                            item.style.display = 'block';
                            setTimeout(() => item.style.opacity = '1', 50);
                        } else {
                            item.style.display = 'none';
                        }
                    }, 300);
                });
            });
        });
    }
}