document.addEventListener("DOMContentLoaded", () => {
    // ─── Referensi Elemen ───────────────────────────────────────────────
    const menuSelect       = document.getElementById('menuSelect');
    const qtyInput         = document.getElementById('qty');
    const btnAddItem       = document.getElementById('btnAddItem');
    const itemsContainer   = document.getElementById('orderItemsContainer');
    const textSubtotal     = document.getElementById('textSubtotal');
    const textShipping     = document.getElementById('textShipping');
    const textTotal        = document.getElementById('textTotal');
    const btnSaveOrder     = document.getElementById('btnSaveOrder');
    const btnCalculateShipping = document.getElementById('btnCalculateShipping');

    // ─── State ──────────────────────────────────────────────────────────
    let availableProducts = [];
    // packages: array of { id, name, items: [{id, name, price, category, qty}] }
    let packages          = [];
    // regularItems: array paket_besar { id, name, price, category, qty }
    let regularItems      = [];
    let shippingData      = { cost: 0, distance: 0, lat: null, lon: null, calculated: false };

    // Produk kue_satuan yang sedang menunggu dipilihkan paket
    let pendingKueSatuan  = null;

    // ─── Format Rupiah ──────────────────────────────────────────────────
    const formatRp = (n) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    // ─── 1. Load Menu dari API ──────────────────────────────────────────
    async function loadMenus() {
        try {
            const res  = await fetch('../api/products/index.php');
            const data = await res.json();

            menuSelect.innerHTML = '<option value="" selected disabled>Pilih menu dari daftar...</option>';
            availableProducts = [...data.kue_satuan, ...data.paket_besar];

            const optPaket = document.createElement('optgroup');
            optPaket.label = "Paket Besar";
            data.paket_besar.forEach(p => {
                optPaket.innerHTML += `<option value="${p.id}" data-category="${p.category}">${p.name} - ${formatRp(p.price)}</option>`;
            });

            const optKue = document.createElement('optgroup');
            optKue.label = "Kue Satuan";
            data.kue_satuan.forEach(p => {
                optKue.innerHTML += `<option value="${p.id}" data-category="${p.category}">${p.name} - ${formatRp(p.price)}</option>`;
            });

            menuSelect.appendChild(optPaket);
            menuSelect.appendChild(optKue);
        } catch (err) {
            console.error("Gagal memuat menu:", err);
            menuSelect.innerHTML = '<option value="" disabled>Gagal memuat menu. Cek koneksi.</option>';
        }
    }

    // ─── 2. Tambah Item ke Keranjang ────────────────────────────────────
    btnAddItem.addEventListener('click', () => {
        const productId = menuSelect.value;
        const qty       = parseInt(qtyInput.value) || 1;

        if (!productId) return alert('Silakan pilih hidangan terlebih dahulu.');
        if (qty < 1)    return alert('Jumlah minimal 1.');

        const product = availableProducts.find(p => p.id == productId);
        if (!product) return;

        if (product.category === 'kue_satuan') {
            // Simpan sementara dan minta user pilih / buat paket
            pendingKueSatuan = { ...product, qty };
            openPackageModal();
        } else {
            // Paket Besar — langsung ke regularItems
            const existing = regularItems.find(i => i.id == productId);
            if (existing) {
                existing.qty += qty;
            } else {
                regularItems.push({ ...product, qty });
            }
            menuSelect.value = '';
            qtyInput.value   = 1;
            renderCart();
        }
    });

    // ─── 3. Modal Manajemen Paket Kue Satuan ────────────────────────────

    function openPackageModal() {
        renderPackageModalList();
        const modalEl = document.getElementById('packageModal');
        new bootstrap.Modal(modalEl).show();
    }

    function renderPackageModalList() {
        const container = document.getElementById('modalPackageList');
        if (!container) return;
        container.innerHTML = '';

        if (packages.length === 0) {
            container.innerHTML = '<p class="text-muted small mb-0">Belum ada paket. Silakan buat paket baru di bawah.</p>';
            return;
        }

        packages.forEach(pkg => {
            const count = pkg.items.reduce((s, i) => s + i.qty, 0);
            container.innerHTML += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 bg-white mb-2">
                    <div>
                        <div class="fw-semibold">${pkg.name}</div>
                        <div class="text-muted small">${count} item di dalam paket</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary-custom btn-select-pkg" data-pkg-id="${pkg.id}">
                        Pilih
                    </button>
                </div>
            `;
        });

        // Bind tombol pilih
        container.querySelectorAll('.btn-select-pkg').forEach(btn => {
            btn.addEventListener('click', () => {
                const pkgId = btn.getAttribute('data-pkg-id');
                addKueSatuanToPackage(pkgId);
                bootstrap.Modal.getInstance(document.getElementById('packageModal')).hide();
            });
        });
    }

    document.addEventListener('click', (e) => {
        // Buat paket baru dari modal
        if (e.target.id === 'btnCreateNewPackage') {
            const nameInput = document.getElementById('newPackageName');
            const name      = nameInput.value.trim() || 'Paket Baru';
            const newId     = 'pkg-' + Date.now();
            packages.push({ id: newId, name, items: [] });
            nameInput.value = '';
            addKueSatuanToPackage(newId);
            bootstrap.Modal.getInstance(document.getElementById('packageModal')).hide();
        }
    });

    function addKueSatuanToPackage(pkgId) {
        if (!pendingKueSatuan) return;
        const pkg = packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const existing = pkg.items.find(i => i.id == pendingKueSatuan.id);
        if (existing) {
            existing.qty += pendingKueSatuan.qty;
        } else {
            pkg.items.push({ ...pendingKueSatuan });
        }

        pendingKueSatuan   = null;
        menuSelect.value   = '';
        qtyInput.value     = 1;
        renderCart();
    }

    // ─── 4. Render Keranjang & Hitung Total ─────────────────────────────
    function renderCart() {
        itemsContainer.innerHTML = '';
        let subtotal = 0;

        const hasItems = packages.length > 0 || regularItems.length > 0;

        if (!hasItems) {
            itemsContainer.innerHTML = '<div class="text-center text-muted small py-4">Belum ada menu yang dipilih.</div>';
        } else {
            // Render Paket Kue Satuan
            packages.forEach((pkg, pkgIdx) => {
                const pkgTotal = pkg.items.reduce((s, i) => s + i.price * i.qty, 0);
                subtotal += pkgTotal;

                let itemsHTML = pkg.items.length === 0
                    ? '<div class="text-muted small ps-2 mb-1">Paket masih kosong.</div>'
                    : '';

                pkg.items.forEach((item, itemIdx) => {
                    itemsHTML += `
                        <div class="d-flex justify-content-between align-items-center mb-1 ps-2">
                            <span class="small text-dark">${item.name} <span class="text-muted">x${item.qty}</span></span>
                            <span class="small fw-medium">${formatRp(item.price * item.qty)}</span>
                        </div>
                    `;
                });

                itemsContainer.innerHTML += `
                    <div class="border rounded-3 mb-3 overflow-hidden">
                        <div class="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-bottom">
                            <div class="d-flex align-items-center gap-2">
                                <span class="material-symbols-outlined text-primary-custom fs-6">inventory_2</span>
                                <span class="fw-semibold small">${pkg.name}</span>
                                <span class="badge bg-primary-subtle text-primary-custom" style="font-size:0.6rem;">Kue Satuan</span>
                            </div>
                            <button type="button" class="btn btn-sm text-danger p-0 border-0" onclick="removePackage(${pkgIdx})" title="Hapus Paket">
                                <span class="material-symbols-outlined fs-6">delete</span>
                            </button>
                        </div>
                        <div class="p-2">${itemsHTML}</div>
                        <div class="d-flex justify-content-between px-3 py-2 border-top bg-light">
                            <span class="small text-muted">Subtotal Paket</span>
                            <span class="small fw-bold">${formatRp(pkgTotal)}</span>
                        </div>
                    </div>
                `;
            });

            // Render Paket Besar (Regular Items)
            regularItems.forEach((item, idx) => {
                const totalItem = item.price * item.qty;
                subtotal += totalItem;

                itemsContainer.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                            <div class="fw-medium text-dark">${item.name} <span class="badge bg-light text-dark border ms-1" style="font-size:0.6rem;">Paket Besar</span></div>
                            <div class="text-muted small">${formatRp(item.price)} x ${item.qty}</div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <span class="fw-bold text-dark">${formatRp(totalItem)}</span>
                            <button type="button" class="btn btn-sm text-danger p-0 border-0" onclick="removeRegularItem(${idx})">
                                <span class="material-symbols-outlined fs-5">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        updateSummary(subtotal);
    }

    window.removePackage = (pkgIdx) => {
        if (confirm(`Hapus paket "${packages[pkgIdx].name}" beserta isinya?`)) {
            packages.splice(pkgIdx, 1);
            renderCart();
        }
    };

    window.removeRegularItem = (idx) => {
        regularItems.splice(idx, 1);
        renderCart();
    };

    function updateSummary(subtotal) {
        textSubtotal.innerText = formatRp(subtotal);
        textShipping.innerText = formatRp(shippingData.cost);
        textTotal.innerText    = formatRp(subtotal + shippingData.cost);

        const hasItems = packages.length > 0 || regularItems.length > 0;
        btnSaveOrder.disabled = !(hasItems && shippingData.calculated);
    }

    // ─── 5. Hitung Ongkos Kirim ─────────────────────────────────────────
    btnCalculateShipping.addEventListener('click', async () => {
        const street = document.getElementById('streetName').value.trim();
        const house  = document.getElementById('houseNumber').value.trim();
        const kel    = document.getElementById('kelurahan').value.trim();
        const kec    = document.getElementById('kecamatan').value;

        // Validasi sama dengan checkout.js — house wajib diisi
        if (!street || !house || !kel || !kec) {
            return alert('Mohon isi Nama Jalan, Nomor Rumah, Kelurahan, dan Kecamatan untuk menghitung ongkir.');
        }

        const loading   = document.getElementById('shippingLoading');
        const resultDiv = document.getElementById('shippingResult');
        const errorDiv  = document.getElementById('shippingError');

        btnCalculateShipping.disabled = true;
        btnCalculateShipping.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menghitung...';
        loading.classList.remove('d-none');
        resultDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');

        try {
            // Kirim field yang SAMA persis dengan checkout.js agar hasilnya konsisten
            const response = await fetch('../api/shipping/calculate.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ street, house, kel, kec })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Gagal menghitung biaya pengiriman.');
            }

            shippingData = {
                cost:       data.shipping_cost,
                distance:   data.rounded_km,
                lat:        data.lat,
                lon:        data.lon,
                calculated: true
            };

            const fallbackNote = data.used_fallback
                ? `<div class="small text-warning mt-1"><span class="material-symbols-outlined align-middle" style="font-size:14px;">info</span> Estimasi jarak (layanan rute tidak tersedia).</div>`
                : '';

            resultDiv.innerHTML = `
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="material-symbols-outlined text-success" style="font-size:16px;">check_circle</span>
                    <strong class="small text-success">Biaya pengiriman berhasil dihitung!</strong>
                </div>
                <div class="small"><strong>Jarak:</strong> ${data.rounded_km.toFixed(1)} km &nbsp;|&nbsp; <strong>Ongkir:</strong> ${formatRp(data.shipping_cost)}</div>
                ${fallbackNote}
            `;
            resultDiv.classList.remove('d-none');

            // Refresh keranjang untuk tampilkan ongkir terbaru
            const subtotal = packages.reduce((s, pkg) => s + pkg.items.reduce((ps, i) => ps + i.price * i.qty, 0), 0)
                           + regularItems.reduce((s, i) => s + i.price * i.qty, 0);
            updateSummary(subtotal);

        } catch (err) {
            shippingData.calculated = false;
            errorDiv.innerHTML = `
                <div class="d-flex align-items-start gap-2">
                    <span class="material-symbols-outlined text-danger flex-shrink-0" style="font-size:16px;margin-top:2px;">error</span>
                    <div>
                        <strong class="small text-danger d-block">Gagal menghitung biaya pengiriman</strong>
                        <span class="text-muted small">${err.message || 'Gagal menghubungi server.'}</span>
                    </div>
                </div>
            `;
            errorDiv.classList.remove('d-none');
            const subtotal = packages.reduce((s, pkg) => s + pkg.items.reduce((ps, i) => ps + i.price * i.qty, 0), 0)
                           + regularItems.reduce((s, i) => s + i.price * i.qty, 0);
            updateSummary(subtotal);
        } finally {
            loading.classList.add('d-none');
            btnCalculateShipping.disabled = false;
            btnCalculateShipping.innerHTML = '<span class="material-symbols-outlined">local_shipping</span> Hitung Biaya Pengiriman';
        }
    });

    // Reset ongkir jika alamat diubah (konsisten dengan checkout.js)
    ['streetName', 'houseNumber', 'kelurahan', 'kecamatan'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            shippingData = { cost: 0, distance: 0, lat: null, lon: null, calculated: false };
            document.getElementById('shippingResult').classList.add('d-none');
            const subtotal = packages.reduce((s, pkg) => s + pkg.items.reduce((ps, i) => ps + i.price * i.qty, 0), 0)
                           + regularItems.reduce((s, i) => s + i.price * i.qty, 0);
            updateSummary(subtotal);
        });
    });

    // ─── 6. Submit Pesanan ──────────────────────────────────────────────
    document.getElementById('adminOrderForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const hasItems = packages.length > 0 || regularItems.length > 0;
        if (!hasItems)               return alert('Keranjang masih kosong!');
        if (!shippingData.calculated) return alert('Harap hitung biaya pengiriman terlebih dahulu.');

        btnSaveOrder.disabled = true;
        btnSaveOrder.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

        const subtotal = packages.reduce((s, pkg) => s + pkg.items.reduce((ps, i) => ps + i.price * i.qty, 0), 0)
                       + regularItems.reduce((s, i) => s + i.price * i.qty, 0);

        const payload = {
            customer_name:        `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
            customer_email:       document.getElementById('email').value.trim(),
            customer_phone:       document.getElementById('phone').value.trim(),
            subtotal:             subtotal,
            shipping_distance_km: shippingData.distance,
            delivery_street:      document.getElementById('streetName').value.trim(),
            delivery_house_number:document.getElementById('houseNumber').value.trim(),
            delivery_rt:          document.getElementById('rt').value.trim(),
            delivery_rw:          document.getElementById('rw').value.trim(),
            delivery_kelurahan:   document.getElementById('kelurahan').value.trim(),
            delivery_kecamatan:   document.getElementById('kecamatan').value,
            delivery_postal_code: document.getElementById('postalCode').value.trim(),
            delivery_landmark:    document.getElementById('landmark').value.trim(),
            dest_latitude:        shippingData.lat,
            dest_longitude:       shippingData.lon,
            delivery_date:        document.getElementById('deliveryDate').value,
            delivery_time:        document.getElementById('deliveryTime').value,
            order_notes:          document.getElementById('orderNotes').value.trim(),
            cart: {
                kue_satuan:  packages,       // Array paket kue satuan
                paket_besar: regularItems    // Array item paket besar
            }
        };

        try {
            const response = await fetch('../api/orders/create.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Sukses! Pesanan baru berhasil dibuat.\nNomor Pesanan: ${result.order_number}`);
                window.location.href = 'pesanan.html';
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error("Error submit order:", err);
            alert("Gagal membuat pesanan: " + err.message);
            btnSaveOrder.disabled = false;
            btnSaveOrder.innerHTML = '<span class="material-symbols-outlined fs-6">save</span> Buat Pesanan';
        }
    });

    // ─── Inisialisasi ───────────────────────────────────────────────────
    loadMenus();
});