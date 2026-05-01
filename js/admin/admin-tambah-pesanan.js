document.addEventListener("DOMContentLoaded", () => {
    // Referensi Elemen
    const menuSelect = document.getElementById('menuSelect');
    const qtyInput = document.getElementById('qty');
    const btnAddItem = document.getElementById('btnAddItem');
    const itemsContainer = document.getElementById('orderItemsContainer');

    const textSubtotal = document.getElementById('textSubtotal');
    const textShipping = document.getElementById('textShipping');
    const textTotal = document.getElementById('textTotal');
    const btnSaveOrder = document.getElementById('btnSaveOrder');
    const btnCalculateShipping = document.getElementById('btnCalculateShipping');

    let availableProducts = [];
    let cart = [];
    let shippingData = { cost: 0, distance: 0, lat: null, lon: null, calculated: false };

    // Format Rupiah
    const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    // 1. Fetch Daftar Menu dari API
    async function loadMenus() {
        try {
            const res = await fetch('../api/products/index.php');
            const data = await res.json();

            menuSelect.innerHTML = '<option value="" selected disabled>Pilih menu dari daftar...</option>';

            // Gabungkan array kue_satuan dan paket_besar menjadi satu array untuk kemudahan
            availableProducts = [...data.kue_satuan, ...data.paket_besar];

            // Tambahkan Optgroup agar rapi
            const optKue = document.createElement('optgroup');
            optKue.label = "Kue Satuan";
            data.kue_satuan.forEach(p => {
                optKue.innerHTML += `<option value="${p.id}" data-price="${p.price}" data-category="${p.category}">${p.name} - ${formatRp(p.price)}</option>`;
            });

            const optPaket = document.createElement('optgroup');
            optPaket.label = "Paket Besar";
            data.paket_besar.forEach(p => {
                optPaket.innerHTML += `<option value="${p.id}" data-price="${p.price}" data-category="${p.category}">${p.name} - ${formatRp(p.price)}</option>`;
            });

            menuSelect.appendChild(optPaket);
            menuSelect.appendChild(optKue);

        } catch (error) {
            console.error("Gagal memuat menu:", error);
            menuSelect.innerHTML = '<option value="" disabled>Gagal memuat menu. Cek koneksi.</option>';
        }
    }

    // 2. Tambah Item ke Keranjang Virtual
    btnAddItem.addEventListener('click', () => {
        const productId = menuSelect.value;
        const qty = parseInt(qtyInput.value) || 1;

        if (!productId) return alert('Silakan pilih hidangan terlebih dahulu.');
        if (qty < 1) return alert('Jumlah minimal 1.');

        const product = availableProducts.find(p => p.id == productId);

        // Cek apakah item sudah ada
        const existing = cart.find(i => i.id == productId);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ ...product, qty: qty });
        }

        menuSelect.value = '';
        qtyInput.value = 1;
        renderCart();
    });

    // 3. Render Keranjang & Hitung Total
    function renderCart() {
        itemsContainer.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<div class="text-center text-muted small py-4">Belum ada menu yang dipilih.</div>';
        } else {
            cart.forEach((item, index) => {
                const totalItem = item.price * item.qty;
                subtotal += totalItem;

                itemsContainer.innerHTML += `
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                        <div>
                            <div class="fw-medium text-dark">${item.name} <span class="badge bg-light text-dark border ms-1" style="font-size: 0.6rem;">${item.category === 'paket_besar' ? 'Paket' : 'Satuan'}</span></div>
                            <div class="text-muted small">${formatRp(item.price)} x ${item.qty}</div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <span class="fw-bold text-dark">${formatRp(totalItem)}</span>
                            <button type="button" class="btn btn-sm text-danger p-0 border-0" onclick="removeItem(${index})">
                                <span class="material-symbols-outlined fs-5">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        updateSummary(subtotal);
    }

    window.removeItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    function updateSummary(subtotal) {
        textSubtotal.innerText = formatRp(subtotal);
        textShipping.innerText = formatRp(shippingData.cost);
        textTotal.innerText = formatRp(subtotal + shippingData.cost);

        // Buka gembok tombol simpan jika ada isi dan ongkir sudah dihitung
        btnSaveOrder.disabled = !(cart.length > 0 && shippingData.calculated);
    }

    // 4. Hitung Ongkos Kirim (Memanggil API Proxy Server)
    btnCalculateShipping.addEventListener('click', async () => {
        const street = document.getElementById('streetName').value.trim();
        const kel = document.getElementById('kelurahan').value.trim();
        const kec = document.getElementById('kecamatan').value;

        if (!street || !kel || !kec) {
            return alert('Mohon isi Nama Jalan, Kelurahan, dan Kecamatan untuk menghitung ongkir.');
        }

        const loading = document.getElementById('shippingLoading');
        const resultDiv = document.getElementById('shippingResult');
        const errorDiv = document.getElementById('shippingError');

        btnCalculateShipping.disabled = true;
        loading.classList.remove('d-none');
        resultDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');

        try {
            const response = await fetch('../api/shipping/calculate.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ street, kel, kec })
            });

            const data = await response.json();

            if (data.success) {
                shippingData = {
                    cost: data.shipping_cost,
                    distance: data.rounded_km,
                    lat: data.lat,
                    lon: data.lon,
                    calculated: true
                };

                resultDiv.innerHTML = `<span class="fw-bold">Jarak:</span> ${data.rounded_km} km | <span class="fw-bold">Ongkir:</span> ${formatRp(data.shipping_cost)}`;
                resultDiv.classList.remove('d-none');
                renderCart(); // Perbarui UI tagihan
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            shippingData.calculated = false;
            errorDiv.innerText = error.message || "Gagal menghubungi server untuk menghitung ongkir.";
            errorDiv.classList.remove('d-none');
            renderCart();
        } finally {
            loading.classList.add('d-none');
            btnCalculateShipping.disabled = false;
        }
    });

    // Reset ongkir jika alamat diubah
    ['streetName', 'kelurahan', 'kecamatan'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            shippingData.calculated = false;
            shippingData.cost = 0;
            document.getElementById('shippingResult').classList.add('d-none');
            renderCart();
        });
    });

    // 5. Submit Pesanan
    document.getElementById('adminOrderForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) return alert('Keranjang masih kosong!');
        if (!shippingData.calculated) return alert('Harap hitung biaya pengiriman terlebih dahulu.');

        btnSaveOrder.disabled = true;
        btnSaveOrder.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

        // Memisahkan item menjadi paket_besar dan kue_satuan untuk API Create Order
        const paket_besar = cart.filter(c => c.category === 'paket_besar');
        const kue_satuan_items = cart.filter(c => c.category === 'kue_satuan');

        let kue_satuan = [];
        if (kue_satuan_items.length > 0) {
            // Gabungkan semua kue satuan ke dalam 1 paket virtual agar diterima database
            kue_satuan.push({
                name: "Pesanan Custom Admin",
                qty: 1,
                items: kue_satuan_items
            });
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        const payload = {
            customer_name: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
            customer_email: document.getElementById('email').value.trim(),
            customer_phone: document.getElementById('phone').value.trim(),
            subtotal: subtotal,
            shipping_distance_km: shippingData.distance,
            delivery_street: document.getElementById('streetName').value.trim(),
            delivery_house_number: document.getElementById('houseNumber').value.trim(),
            delivery_rt: document.getElementById('rt').value.trim(),
            delivery_rw: document.getElementById('rw').value.trim(),
            delivery_kelurahan: document.getElementById('kelurahan').value.trim(),
            delivery_kecamatan: document.getElementById('kecamatan').value,
            delivery_postal_code: document.getElementById('postalCode').value.trim(),
            delivery_landmark: document.getElementById('landmark').value.trim(),
            dest_latitude: shippingData.lat,
            dest_longitude: shippingData.lon,
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time: document.getElementById('deliveryTime').value,
            order_notes: document.getElementById('orderNotes').value.trim(),
            cart: {
                paket_besar: paket_besar,
                kue_satuan: kue_satuan
            }
        };

        try {
            const response = await fetch('../api/orders/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Sukses! Pesanan baru berhasil dibuat.\nNomor Pesanan: ${result.order_number}`);
                window.location.href = 'pesanan.html';
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Error submit order:", error);
            alert("Gagal membuat pesanan: " + error.message);
            btnSaveOrder.disabled = false;
            btnSaveOrder.innerHTML = '<span class="material-symbols-outlined fs-6">save</span> Buat Pesanan';
        }
    });

    // Jalankan inisialisasi awal
    loadMenus();
});