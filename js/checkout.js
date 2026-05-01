// js/checkout.js — Checkout Page Logic dengan Backend Proxy API

class CheckoutController {
    constructor(cartManager) {
        this.cart = cartManager;
        this.shippingCalculated = false;
        this.custLat = null;
        this.custLon = null;
        this.distanceKm = null;
        this.init();
    }

    init() {
        this.initDatePicker();
        this.bindShippingButton();
        this.bindOrderButton();
        this.bindAddressChangeReset();
        this.initAutofill();
    }

    // --- Autofill Profile Data ---
    initAutofill() {
        if (typeof window.getCurrentUser !== 'function') return;
        const user = window.getCurrentUser();
        if (!user) return;

        const fName = document.getElementById('firstName');
        const lName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');

        if (fName && !fName.value) fName.value = user.firstName || '';
        if (lName && !lName.value) lName.value = user.lastName || '';
        if (email && !email.value) email.value = user.email || '';
        if (phone && !phone.value) phone.value = user.phone || '';

        let addresses = [];
        try {
            const addrsStr = localStorage.getItem('zaralis_addresses');
            if (addrsStr) addresses = JSON.parse(addrsStr);
        } catch (e) { }

        const addressSelectContainer = document.getElementById('savedAddressesContainer');
        const addressSelect = document.getElementById('savedAddressSelect');
        const saveAddressContainer = document.getElementById('saveAddressToProfileContainer');

        if (addresses.length > 0) {
            if (addressSelectContainer) addressSelectContainer.classList.remove('d-none');

            addresses.forEach(addr => {
                const isMain = addr.isMain ? ' (Utama)' : '';
                const option = document.createElement('option');
                option.value = addr.id;
                option.textContent = `${addr.streetName} — Kec. ${addr.kecamatan}${isMain}`;
                if (addr.isMain) option.selected = true;
                addressSelect.appendChild(option);
            });

            if (addressSelect) {
                addressSelect.addEventListener('change', (e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) {
                        this.clearAddressForm();
                        return;
                    }
                    const addr = addresses.find(a => a.id === selectedId);
                    if (addr) this.fillAddressForm(addr);
                });
            }

            const mainAddr = addresses.find(a => a.isMain) || addresses[0];
            if (mainAddr) this.fillAddressForm(mainAddr);

        } else {
            if (saveAddressContainer) saveAddressContainer.classList.remove('d-none');
        }
    }

    fillAddressForm(addr) {
        if (document.getElementById('streetName')) document.getElementById('streetName').value = addr.streetName || '';
        if (document.getElementById('houseNumber')) document.getElementById('houseNumber').value = addr.houseNumber || '';
        if (document.getElementById('rt')) document.getElementById('rt').value = addr.rt || '';
        if (document.getElementById('rw')) document.getElementById('rw').value = addr.rw || '';
        if (document.getElementById('kelurahan')) document.getElementById('kelurahan').value = addr.kelurahan || '';
        if (document.getElementById('kecamatan')) document.getElementById('kecamatan').value = addr.kecamatan || '';
        if (document.getElementById('postalCode')) document.getElementById('postalCode').value = addr.postalCode || '';
        if (document.getElementById('landmark')) document.getElementById('landmark').value = addr.landmark || '';
        this.resetShipping();
    }

    clearAddressForm() {
        if (document.getElementById('streetName')) document.getElementById('streetName').value = '';
        if (document.getElementById('houseNumber')) document.getElementById('houseNumber').value = '';
        if (document.getElementById('rt')) document.getElementById('rt').value = '';
        if (document.getElementById('rw')) document.getElementById('rw').value = '';
        if (document.getElementById('kelurahan')) document.getElementById('kelurahan').value = '';
        if (document.getElementById('kecamatan')) document.getElementById('kecamatan').value = '';
        if (document.getElementById('postalCode')) document.getElementById('postalCode').value = '';
        if (document.getElementById('landmark')) document.getElementById('landmark').value = '';
        this.resetShipping();
    }

    // --- Date Picker H+3 ---
    initDatePicker() {
        const dateInput = document.getElementById('deliveryDate');
        if (!dateInput) return;

        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 3);

        // Gunakan format lokal YYYY-MM-DD agar tidak bergeser karena UTC
        const year = minDate.getFullYear();
        const month = String(minDate.getMonth() + 1).padStart(2, '0');
        const day = String(minDate.getDate()).padStart(2, '0');
        const minDateStr = `${year}-${month}-${day}`;
        
        dateInput.setAttribute('min', minDateStr);

        dateInput.addEventListener('change', () => {
            const selected = new Date(dateInput.value + 'T00:00:00');
            const minAllowed = new Date(today);
            minAllowed.setDate(today.getDate() + 3);
            minAllowed.setHours(0, 0, 0, 0);

            if (selected < minAllowed) {
                dateInput.value = '';
                dateInput.classList.add('is-invalid');
            } else {
                dateInput.classList.remove('is-invalid');
            }
        });
    }

    // --- Reset shipping when address changes ---
    bindAddressChangeReset() {
        const addressFields = ['streetName', 'houseNumber', 'kelurahan', 'kecamatan', 'postalCode'];
        addressFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.resetShipping());
                el.addEventListener('change', () => this.resetShipping());
            }
        });
    }

    resetShipping() {
        if (!this.shippingCalculated) return;
        this.shippingCalculated = false;
        this.cart.shippingCost = 0;
        this.custLat = null;
        this.custLon = null;
        this.distanceKm = null;

        const shippingText = document.getElementById('checkoutShippingCostText');
        if (shippingText) {
            shippingText.innerText = 'Belum dihitung';
            shippingText.style.color = '#6c757d';
            shippingText.style.fontStyle = 'italic';
        }

        document.getElementById('shippingResult')?.classList.add('d-none');
        document.getElementById('shippingError')?.classList.add('d-none');

        this.cart.updateCheckoutTotal();
        this.updateOrderButton();
    }

    // --- Shipping Calculation ---
    bindShippingButton() {
        const btn = document.getElementById('btnCalculateShipping');
        if (!btn) return;
        btn.addEventListener('click', () => this.calculateShipping());
    }

    getAddressFields() {
        const street = document.getElementById('streetName')?.value?.trim() || '';
        const house = document.getElementById('houseNumber')?.value?.trim() || '';
        const kel = document.getElementById('kelurahan')?.value?.trim() || '';
        const kec = document.getElementById('kecamatan')?.value || '';

        if (!street || !house || !kel || !kec) return null;
        return { street, house, kel, kec };
    }

    async calculateShipping() {
        const fields = this.getAddressFields();
        if (!fields) {
            this.showShippingError('Harap lengkapi field Nama Jalan, Nomor Rumah, Kelurahan, dan Kecamatan terlebih dahulu.');
            return;
        }

        const btn = document.getElementById('btnCalculateShipping');
        const loading = document.getElementById('shippingLoading');
        const resultDiv = document.getElementById('shippingResult');
        const errorDiv = document.getElementById('shippingError');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menghitung...';
        loading.classList.remove('d-none');
        resultDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');

        try {
            // Kirim data alamat ke backend proxy — server yang menghubungi Nominatim & OSRM
            const response = await fetch('api/shipping/calculate.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    street: fields.street,
                    house: fields.house,
                    kel: fields.kel,
                    kec: fields.kec
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal menghitung biaya pengiriman.');
            }

            const { lat, lon, rounded_km, shipping_cost, used_fallback } = result;

            this.shippingCalculated = true;
            this.cart.shippingCost = shipping_cost;

            // Simpan koordinat dan jarak untuk payload order
            this.custLat = lat;
            this.custLon = lon;
            this.distanceKm = rounded_km;

            const fallbackNote = used_fallback
                ? `<div class="d-flex align-items-center gap-1 mt-2">
                       <span class="material-symbols-outlined" style="font-size: 14px; color: #E07A5F;">info</span>
                       <span class="text-muted" style="font-size: 11px;">Estimasi berdasarkan jarak garis lurus (layanan rute sedang tidak tersedia)</span>
                   </div>`
                : '';

            resultDiv.innerHTML = `
                <div class="shipping-result-card">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-primary-custom">check_circle</span>
                        <strong class="text-primary-custom small">Biaya pengiriman berhasil dihitung!</strong>
                    </div>
                    <div class="result-distance mb-1">
                        <span class="text-muted small">Jarak tempuh ${used_fallback ? '(estimasi)' : ''}</span>
                        <span class="fw-bold small">${rounded_km.toFixed(1)} km</span>
                    </div>
                    <div class="result-cost">
                        <span class="text-muted small">Biaya pengiriman</span>
                        <span class="fw-bold" style="color: #2D6A4F;">${this.cart.formatRp(shipping_cost)}</span>
                    </div>
                    ${fallbackNote}
                </div>
            `;
            resultDiv.classList.remove('d-none');

            const shippingText = document.getElementById('checkoutShippingCostText');
            if (shippingText) {
                shippingText.innerText = this.cart.formatRp(shipping_cost);
                shippingText.style.color = '#2D6A4F';
                shippingText.style.fontStyle = 'normal';
                shippingText.style.fontWeight = '600';
            }
            this.cart.updateCheckoutTotal();
            this.updateOrderButton();

        } catch (err) {
            console.error('Shipping calculation error:', err);
            const userMessage = err.message && !err.message.includes('fetch')
                ? err.message
                : 'Layanan penghitungan ongkir sedang tidak tersedia. Silakan coba lagi dalam beberapa saat.';
            this.showShippingError(userMessage);
        } finally {
            loading.classList.add('d-none');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined fs-5">local_shipping</span> Hitung Biaya Pengiriman';
        }
    }

    showShippingError(message) {
        const errorDiv = document.getElementById('shippingError');
        if (!errorDiv) return;
        errorDiv.innerHTML = `
            <div class="shipping-error-card d-flex align-items-start gap-2">
                <span class="material-symbols-outlined text-danger flex-shrink-0" style="margin-top: 2px;">error</span>
                <div>
                    <strong class="small text-danger d-block mb-1">Gagal menghitung biaya pengiriman</strong>
                    <span class="text-muted small">${message}</span>
                </div>
            </div>
        `;
        errorDiv.classList.remove('d-none');
        document.getElementById('shippingResult')?.classList.add('d-none');
    }

    // --- Order Button & API Process ---
    bindOrderButton() {
        const btn = document.getElementById('btnCreateOrder');
        if (!btn) return;
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (this.validateCheckoutForm()) {
                await this.processOrder();
            }
        });
    }

    validateCheckoutForm() {
        const form = document.getElementById('checkoutForm');
        if (!form) return false;

        let valid = true;

        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'deliveryDate', 'deliveryTime', 'streetName', 'houseNumber', 'kelurahan', 'kecamatan'];
        requiredFields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!el.value || el.value.trim() === '') {
                el.classList.add('is-invalid');
                valid = false;
            } else {
                el.classList.remove('is-invalid');
            }
        });

        const dateInput = document.getElementById('deliveryDate');
        if (dateInput && dateInput.value) {
            const selected = new Date(dateInput.value + 'T00:00:00');
            const today = new Date();
            const minDate = new Date(today);
            minDate.setDate(today.getDate() + 3);
            minDate.setHours(0, 0, 0, 0);
            if (selected < minDate) {
                dateInput.classList.add('is-invalid');
                valid = false;
            }
        }

        if (!this.shippingCalculated) {
            this.showShippingError('Biaya pengiriman harus dihitung terlebih dahulu sebelum membuat pesanan.');
            valid = false;
        }

        if (!valid) {
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return valid;
    }

    async processOrder() {
        const btn = document.getElementById('btnCreateOrder');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Memproses pesanan...';

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const customerName = `${firstName} ${lastName}`;

        const payload = {
            customer_name: customerName,
            customer_email: document.getElementById('email').value.trim(),
            customer_phone: document.getElementById('phone').value.trim(),
            subtotal: this.cart.checkoutSubtotal,
            shipping_distance_km: this.distanceKm,
            delivery_street: document.getElementById('streetName').value.trim(),
            delivery_house_number: document.getElementById('houseNumber').value.trim(),
            delivery_rt: document.getElementById('rt').value.trim(),
            delivery_rw: document.getElementById('rw').value.trim(),
            delivery_kelurahan: document.getElementById('kelurahan').value.trim(),
            delivery_kecamatan: document.getElementById('kecamatan').value,
            delivery_postal_code: document.getElementById('postalCode').value.trim(),
            delivery_landmark: document.getElementById('landmark') ? document.getElementById('landmark').value.trim() : '',
            dest_latitude: this.custLat,
            dest_longitude: this.custLon,
            delivery_date: document.getElementById('deliveryDate').value,
            delivery_time: document.getElementById('deliveryTime').value,
            order_notes: document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '',
            cart: {
                kue_satuan: this.cart.state.packages,
                paket_besar: this.cart.state.regularItems
            }
        };

        try {
            const response = await fetch('api/orders/create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                this.processSaveNewAddress();
                localStorage.removeItem('zarali_cart_v2');
                window.location.href = `order-confirmation.html?order=${result.order_number}`;
            } else {
                alert("Gagal membuat pesanan: " + result.message);
                btn.disabled = false;
                btn.innerText = 'Buat Pesanan Sekarang';
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
            btn.disabled = false;
            btn.innerText = 'Buat Pesanan Sekarang';
        }
    }

    processSaveNewAddress() {
        const saveCb = document.getElementById('saveAddressToProfile');
        if (saveCb && saveCb.checked) {
            let addresses = [];
            try {
                const addrsStr = localStorage.getItem('zaralis_addresses');
                if (addrsStr) addresses = JSON.parse(addrsStr);
            } catch (e) { }

            if (addresses.length >= 3) return;

            const newAddress = {
                id: 'addr_' + Date.now().toString(36),
                streetName: document.getElementById('streetName').value,
                houseNumber: document.getElementById('houseNumber').value,
                rt: document.getElementById('rt').value,
                rw: document.getElementById('rw').value,
                kelurahan: document.getElementById('kelurahan').value,
                kecamatan: document.getElementById('kecamatan').value,
                postalCode: document.getElementById('postalCode').value,
                landmark: document.getElementById('landmark').value,
                isMain: addresses.length === 0
            };

            addresses.push(newAddress);
            localStorage.setItem('zaralis_addresses', JSON.stringify(addresses));
        }
    }

    updateOrderButton() {
        const btn = document.getElementById('btnCreateOrder');
        if (!btn) return;
        if (this.shippingCalculated) {
            btn.disabled = false;
            btn.classList.remove('disabled');
        } else {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('checkoutOrderItems')) {
        window.checkoutCtrl = new CheckoutController(window.cart);
    }
});