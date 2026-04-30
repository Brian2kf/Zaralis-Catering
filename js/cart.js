// js/cart.js - Keranjang Belanja logic & localStorage v2

const CART_STORAGE_KEY = 'zarali_cart_v2';

class CartManager {
    constructor() {
        this.state = this.loadCart();
        this.selectedProductForPackage = null;
        this.init();
    }

    init() {
        this.updateBadge();
        this.bindMenuEvents();

        // Cart Page
        if (document.querySelector('.col-lg-8 .d-flex.flex-column.gap-3') && document.querySelector('.summary-card')) {
            this.renderCart();
            this.bindCartPageEvents();
        }

        // Checkout Page
        if (document.getElementById('checkoutOrderItems')) {
            this.renderCheckoutSummary();
        }
    }

    loadCart() {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.packages && parsed.regularItems) return parsed;
            } catch (e) { }
        }
        return { packages: [], regularItems: [] };
    }

    saveCart() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.state));
        this.updateBadge();

        if (document.querySelector('.summary-card')) {
            this.renderCart();
        }
    }

    formatRp(number) {
        return `Rp ${number.toLocaleString('id-ID')}`;
    }

    showToast(message) {
        alert(message);
    }

    // --- Core Operations ---

    addRegularItem(product) {
        const existingItem = this.state.regularItems.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.qty += product.qty;
        } else {
            this.state.regularItems.push(product);
        }
        this.saveCart();
        this.showToast(`${product.name} ditambahkan ke keranjang!`);
    }

    updateRegularItemQty(id, newQty) {
        const item = this.state.regularItems.find(i => i.id === id);
        if (item) {
            item.qty = parseInt(newQty);
            if (item.qty <= 0) {
                this.state.regularItems = this.state.regularItems.filter(i => i.id !== id);
            }
            this.saveCart();
        }
    }

    removeRegularItem(id) {
        this.state.regularItems = this.state.regularItems.filter(item => item.id !== id);
        this.saveCart();
    }

    createPackage(name) {
        const newPkg = {
            id: 'pkg-' + Date.now(),
            name: name,
            items: [],
            qty: 1
        };
        this.state.packages.push(newPkg);
        this.saveCart();
        return newPkg.id;
    }

    updatePackageQty(pkgId, newQty) {
        const pkg = this.state.packages.find(p => p.id === pkgId);
        if (pkg) {
            pkg.qty = parseInt(newQty);
            if (pkg.qty <= 0) {
                this.deletePackage(pkgId);
            } else {
                this.saveCart();
            }
        }
    }

    deletePackage(pkgId) {
        if (confirm("Apakah Anda yakin ingin menghapus paket ini berserta isinya?")) {
            this.state.packages = this.state.packages.filter(p => p.id !== pkgId);
            this.saveCart();
        }
    }

    renamePackage(pkgId, newName) {
        const pkg = this.state.packages.find(p => p.id === pkgId);
        if (pkg && newName.trim() !== '') {
            pkg.name = newName.trim();
            this.saveCart();
        }
    }

    addItemToPackage(pkgId, product) {
        const pkg = this.state.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const existingItem = pkg.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.qty += product.qty;
        } else {
            pkg.items.push(product);
        }
        this.saveCart();
        this.showToast(`${product.name} dimasukkan ke ${pkg.name}!`);
    }

    updateItemQtyInPackage(pkgId, productId, newQty) {
        const pkg = this.state.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const item = pkg.items.find(i => i.id === productId);
        if (item) {
            item.qty = parseInt(newQty);
            if (item.qty <= 0) {
                pkg.items = pkg.items.filter(i => i.id !== productId);
            }
            this.saveCart();
        }
    }

    removeItemFromPackage(pkgId, productId) {
        const pkg = this.state.packages.find(p => p.id === pkgId);
        if (pkg) {
            pkg.items = pkg.items.filter(i => i.id !== productId);
            this.saveCart();
        }
    }

    // --- Validation ---

    validateCart() {
        let valid = true;
        let reasons = [];

        let invalidPackageCount = 0;
        let totalPackageCount = 0;

        this.state.packages.forEach(pkg => {
            const pQty = pkg.qty || 1;
            totalPackageCount += pQty;
            const totalItems = pkg.items.reduce((sum, item) => sum + item.qty, 0);
            if (totalItems > 0 && totalItems < 3) {
                invalidPackageCount++;
            }
        });

        if (invalidPackageCount > 0) {
            valid = false;
            reasons.push('itemCountWarning');
        }

        if (totalPackageCount > 0 && totalPackageCount < 10) {
            valid = false;
            reasons.push('packageCountWarning');
        }

        if (this.state.packages.length === 0 && this.state.regularItems.length === 0) {
            valid = false;
            reasons.push('emptyCart');
        }

        return { valid, reasons, totalPackageCount };
    }

    // --- UI Interactions ---

    bindMenuEvents() {
        document.body.addEventListener('click', (e) => {
            // Add Regular Item
            const addCartBtn = e.target.closest('.add-to-cart-btn');
            if (addCartBtn) {
                e.preventDefault();
                const card = addCartBtn.closest('.product-card');
                if (card) {
                    const name = card.querySelector('h3').innerText;
                    const priceText = card.querySelector('.text-secondary-custom').innerText;
                    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
                    const img = card.querySelector('img').src;

                    this.addRegularItem({
                        id: name.toLowerCase().replace(/\s+/g, '-'),
                        name: name,
                        price: price,
                        qty: 1,
                        image: img
                    });
                }
            }

            // Add to Paket Modal Trigger
            const addPaketBtn = e.target.closest('.add-to-paket-btn');
            if (addPaketBtn) {
                e.preventDefault();
                const card = addPaketBtn.closest('.product-card');
                if (card) {
                    const name = card.querySelector('h3').innerText;
                    const priceText = card.querySelector('.text-secondary-custom').innerText;
                    const price = parseInt(priceText.replace(/[^0-9]/g, ''));
                    const img = card.querySelector('img').src;

                    this.selectedProductForPackage = {
                        id: name.toLowerCase().replace(/\s+/g, '-'),
                        name: name,
                        price: price,
                        qty: 1,
                        image: img
                    };

                    this.openAddToPackageModal();
                }
            }

            // Select package in modal
            const selectPkgBtn = e.target.closest('.select-package-btn');
            if (selectPkgBtn) {
                const pkgId = selectPkgBtn.getAttribute('data-id');
                if (this.selectedProductForPackage) {
                    this.addItemToPackage(pkgId, this.selectedProductForPackage);
                    const modalEl = document.getElementById('addToPackageModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
            }

            // Create new package in modal
            if (e.target.id === 'createNewPackageBtn') {
                const input = document.getElementById('newPackageName');
                const name = input.value.trim() || 'Paket Baru';
                const newPkgId = this.createPackage(name);

                if (this.selectedProductForPackage) {
                    this.addItemToPackage(newPkgId, this.selectedProductForPackage);
                    input.value = '';
                    const modalEl = document.getElementById('addToPackageModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
            }
        });
    }

    openAddToPackageModal() {
        const modalEl = document.getElementById('addToPackageModal');
        if (!modalEl) return;

        document.getElementById('modalProductImage').src = this.selectedProductForPackage.image;
        document.getElementById('modalProductName').innerText = this.selectedProductForPackage.name;
        document.getElementById('modalProductPrice').innerText = this.formatRp(this.selectedProductForPackage.price);

        this.renderPackageListInModal();

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    renderPackageListInModal() {
        const container = document.getElementById('packageListContainer');
        if (!container) return;

        container.innerHTML = '';
        if (this.state.packages.length === 0) {
            container.innerHTML = '<p class="text-muted small">Belum ada paket. Silakan buat di bawah.</p>';
            return;
        }

        this.state.packages.forEach(pkg => {
            const count = pkg.items.reduce((sum, item) => sum + item.qty, 0);
            container.innerHTML += `
                <div class="d-flex justify-content-between align-items-center border rounded p-2 bg-white">
                    <div>
                        <div class="fw-bold fs-6">${pkg.name}</div>
                        <div class="text-muted small">${count} Item</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary-custom select-package-btn" data-id="${pkg.id}">Pilih</button>
                </div>
            `;
        });
    }

    updateBadge() {
        const icons = Array.from(document.querySelectorAll('.material-symbols-outlined')).filter(el => el.textContent.trim() === 'shopping_cart');
        const cartContainers = new Set();
        icons.forEach(icon => {
            const container = icon.closest('a, button');
            if (container) cartContainers.add(container);
        });

        const totalItems = this.state.regularItems.reduce((sum, item) => sum + item.qty, 0) +
            this.state.packages.reduce((sum, pkg) => sum + (pkg.items.reduce((s, i) => s + i.qty, 0) * (pkg.qty || 1)), 0);

        cartContainers.forEach(container => {
            let badge = container.querySelector('.cart-badge');
            if (totalItems > 0) {
                if (!badge) {
                    container.classList.add('position-relative');
                    badge = document.createElement('span');
                    badge.className = 'cart-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                    badge.style.fontSize = '0.65rem';
                    container.appendChild(badge);
                }
                badge.innerText = totalItems > 99 ? '99+' : totalItems;
            } else {
                if (badge) badge.remove();
            }
        });
    }

    renderCart() {
        const cartContainer = document.querySelector('.col-lg-8 .d-flex.flex-column.gap-3');
        if (!cartContainer) return;

        cartContainer.innerHTML = '';

        if (this.state.packages.length === 0 && this.state.regularItems.length === 0) {
            cartContainer.innerHTML = `
                <div class="text-center py-5 bg-white rounded shadow-sm">
                    <span class="material-symbols-outlined fs-1 text-muted mb-3">shopping_cart</span>
                    <h4 class="text-dark">Keranjang Belanja Kosong</h4>
                    <p class="text-muted">Mari mulai memilih kue favorit Anda.</p>
                </div>
            `;
            this.updateSummary();
            return;
        }

        // Render Packages
        this.state.packages.forEach(pkg => {
            const pQty = pkg.qty || 1;
            const pkgTotal = pkg.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

            let itemsHTML = '';
            if (pkg.items.length === 0) {
                itemsHTML = '<div class="text-muted small py-2">Paket ini masih kosong.</div>';
            } else {
                pkg.items.forEach(item => {
                    itemsHTML += `
                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light pkg-item" data-pkg-id="${pkg.id}" data-id="${item.id}">
                            <div class="d-flex align-items-center gap-2">
                                <span class="fw-medium text-dark">${item.name}</span>
                            </div>
                            <div class="d-flex align-items-center gap-4">
                                <span class="text-muted">x ${item.qty}</span>
                                <span class="fw-medium">${this.formatRp(item.price * item.qty)}</span>
                                <div class="d-flex align-items-center bg-light rounded-pill p-1 border">
                                    <button class="btn qty-btn btn-minus p-0" style="width:24px; height:24px;"><span class="material-symbols-outlined fs-6">remove</span></button>
                                    <input type="text" class="text-center border-0 bg-transparent p-0" value="${item.qty}" readonly style="width: 20px; font-size: 0.8rem;">
                                    <button class="btn qty-btn btn-plus p-0" style="width:24px; height:24px;"><span class="material-symbols-outlined fs-6">add</span></button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            const html = `
                <div class="cart-item bg-white p-4 rounded shadow-sm border-start border-4 mb-3" style="border-color: #2D6A4F !important;" data-pkg-id="${pkg.id}">
                    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                        <div class="d-flex align-items-center gap-2">
                            <span class="material-symbols-outlined fs-4 text-primary-custom">inventory_2</span>
                            <h3 class="h5 fw-bold mb-0 text-dark package-name">${pkg.name}</h3>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <div class="d-flex align-items-center bg-light rounded-pill p-1 border" title="Jumlah Paket">
                                <button class="btn qty-btn btn-pkg-minus p-0" style="width:28px; height:28px;"><span class="material-symbols-outlined fs-6">remove</span></button>
                                <input type="text" class="text-center border-0 bg-transparent p-0 fw-bold" value="${pQty}" readonly style="width: 30px; font-size: 0.9rem;">
                                <button class="btn qty-btn btn-pkg-plus p-0" style="width:28px; height:28px;"><span class="material-symbols-outlined fs-6">add</span></button>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-secondary btn-edit-pkg d-flex align-items-center" title="Edit Nama"><span class="material-symbols-outlined fs-6">edit</span></button>
                                <button class="btn btn-sm btn-outline-danger btn-delete-pkg d-flex align-items-center" title="Hapus Paket"><span class="material-symbols-outlined fs-6">delete</span></button>
                            </div>
                        </div>
                    </div>
                    <div class="package-items-container ps-4 mb-3 border-start">
                        ${itemsHTML}
                    </div>
                    <div class="d-flex justify-content-end align-items-center pt-2">
                        <span class="fw-bold me-3">Subtotal Paket (x${pQty}):</span>
                        <span class="fw-bold fs-5 text-primary-custom">${this.formatRp(pkgTotal * pQty)}</span>
                    </div>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', html);
        });

        // Render Regular Items (Paket Besar)
        this.state.regularItems.forEach(item => {
            const html = `
                <div class="cart-item bg-white p-3 p-md-4 rounded shadow-sm d-flex gap-3 gap-md-4 align-items-center regular-item mb-3" data-id="${item.id}">
                    <div class="item-img-container" style="width: 80px; height: 80px; border-radius: 0.5rem; overflow: hidden; flex-shrink: 0;">
                        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="flex-grow-1 d-flex flex-column justify-content-center">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h3 class="h5 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                <span class="material-symbols-outlined fs-5 text-primary-custom">package</span>
                                ${item.name}
                            </h3>
                            <button class="btn btn-link p-2 remove-regular-btn text-decoration-none text-danger" title="Hapus dari keranjang">
                                <span class="material-symbols-outlined fs-5">delete</span>
                            </button>
                        </div>
                        <p class="text-muted small mb-3">Paket Besar</p>
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <span class="fw-bold fs-5" style="color: #E07A5F;">${this.formatRp(item.price)}</span>
                            <div class="d-flex align-items-center gap-3">
                                <div class="d-flex align-items-center bg-light rounded-pill p-1 border">
                                    <button class="btn qty-btn btn-minus" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0;"><span class="material-symbols-outlined fs-6">remove</span></button>
                                    <input type="text" class="qty-input text-center border-0 bg-transparent" value="${item.qty}" readonly style="width: 40px;">
                                    <button class="btn qty-btn btn-plus" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; padding: 0;"><span class="material-symbols-outlined fs-6">add</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', html);
        });

        this.updateSummary();
    }

    updateSummary() {
        const summaryCard = document.querySelector('.summary-card');
        if (!summaryCard) return;

        let subtotal = 0;
        let totalItems = 0;

        this.state.packages.forEach(pkg => {
            const pQty = pkg.qty || 1;
            pkg.items.forEach(item => {
                subtotal += (item.price * item.qty) * pQty;
                totalItems += (item.qty * pQty);
            });
        });

        this.state.regularItems.forEach(item => {
            subtotal += item.price * item.qty;
            totalItems += item.qty;
        });

        const total = subtotal;

        // Update elements
        const detailsContainer = document.getElementById('cartSummaryDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="d-flex justify-content-between text-muted">
                    <span>Subtotal (${totalItems} Item)</span>
                    <span class="fw-medium text-dark">${this.formatRp(subtotal)}</span>
                </div>
            `;
        }

        const totalText = document.getElementById('cartTotalText');
        if (totalText) totalText.innerText = this.formatRp(total);

        // Validations
        const { valid, reasons, totalPackageCount } = this.validateCart();
        const btnCheckout = document.getElementById('btnCheckout');
        const validationContainer = document.getElementById('cartValidationContainer');
        const pkgWarning = document.getElementById('packageCountWarning');
        const itemWarning = document.getElementById('itemCountWarning');

        if (btnCheckout && validationContainer) {
            if (this.state.packages.length > 0 || reasons.includes('packageCountWarning')) {
                validationContainer.classList.remove('d-none');
                pkgWarning.innerText = `Total Paket Kue Satuan: ${totalPackageCount} / 10 paket`;

                if (totalPackageCount < 10) {
                    pkgWarning.parentElement.classList.replace('alert-success', 'alert-warning');
                    pkgWarning.parentElement.querySelector('.material-symbols-outlined').innerText = 'warning';
                } else {
                    pkgWarning.parentElement.classList.replace('alert-warning', 'alert-success');
                    pkgWarning.parentElement.querySelector('.material-symbols-outlined').innerText = 'check_circle';
                }

                if (reasons.includes('itemCountWarning')) {
                    itemWarning.classList.remove('d-none');
                } else {
                    itemWarning.classList.add('d-none');
                }
            } else {
                validationContainer.classList.add('d-none');
            }

            if (valid) {
                btnCheckout.classList.remove('disabled');
                btnCheckout.classList.remove('btn-secondary');
                btnCheckout.classList.add('btn-primary-custom');
                btnCheckout.onclick = () => window.location.href = 'checkout.html';
            } else {
                btnCheckout.classList.add('disabled');
                btnCheckout.onclick = (e) => e.preventDefault();
            }
        }
    }

    renderCheckoutSummary() {
        const orderItemsContainer = document.getElementById('checkoutOrderItems');
        if (!orderItemsContainer) return;

        orderItemsContainer.innerHTML = '';
        let subtotal = 0;
        let totalItemsCount = 0;

        // Render Packages
        this.state.packages.forEach(pkg => {
            const pQty = pkg.qty || 1;
            const pkgTotal = pkg.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            pkg.items.forEach(item => {
                subtotal += (item.price * item.qty) * pQty;
                totalItemsCount += (item.qty * pQty);
            });
            const html = `
                <div class="order-item-mini mb-3 d-flex gap-3 align-items-start pb-3 border-bottom border-light">
                    <div class="d-flex align-items-center justify-content-center bg-light rounded" style="width: 50px; height: 50px; flex-shrink: 0;">
                        <span class="material-symbols-outlined text-primary-custom">inventory_2</span>
                    </div>
                    <div class="flex-grow-1">
                        <h3 class="h6 fw-bold mb-1">${pkg.name}</h3>
                        <p class="small text-muted mb-0">${pQty} x ${this.formatRp(pkgTotal)}</p>
                    </div>
                    <span class="fw-bold" style="color: #E07A5F;">${this.formatRp(pkgTotal * pQty)}</span>
                </div>
            `;
            orderItemsContainer.insertAdjacentHTML('beforeend', html);
        });

        // Render Regular Items
        this.state.regularItems.forEach(item => {
            subtotal += item.price * item.qty;
            totalItemsCount += item.qty;
            const html = `
                <div class="order-item-mini mb-3 d-flex gap-3 align-items-start pb-3 border-bottom border-light">
                    <img src="${item.image}" alt="${item.name}" class="rounded" style="width: 50px; height: 50px; object-fit: cover; flex-shrink: 0;">
                    <div class="flex-grow-1">
                        <h3 class="h6 fw-bold mb-1">${item.name}</h3>
                        <p class="small text-muted mb-0">${item.qty} x ${this.formatRp(item.price)}</p>
                    </div>
                    <span class="fw-bold" style="color: #E07A5F;">${this.formatRp(item.price * item.qty)}</span>
                </div>
            `;
            orderItemsContainer.insertAdjacentHTML('beforeend', html);
        });

        // Store subtotal for shipping calculation
        this.checkoutSubtotal = subtotal;

        // Update Labels
        const subtotalLabel = document.getElementById('checkoutSubtotalLabel');
        const subtotalText = document.getElementById('checkoutSubtotalText');
        const totalText = document.getElementById('checkoutTotalText');

        if (subtotalLabel) subtotalLabel.innerText = `Subtotal (${totalItemsCount} Item)`;
        if (subtotalText) subtotalText.innerText = this.formatRp(subtotal);
        this.updateCheckoutTotal();

        // Redirect to cart if empty
        if (this.state.packages.length === 0 && this.state.regularItems.length === 0) {
            window.location.href = 'cart.html';
        }
    }

    updateCheckoutTotal() {
        const totalText = document.getElementById('checkoutTotalText');
        const shippingCost = this.shippingCost || 0;
        const total = (this.checkoutSubtotal || 0) + shippingCost;
        if (totalText) totalText.innerText = this.formatRp(total);
    }

    bindCartPageEvents() {
        const cartContainer = document.querySelector('.col-lg-8 .d-flex.flex-column.gap-3');
        if (!cartContainer) return;

        cartContainer.addEventListener('click', (e) => {

            // Package Qty Update
            if (e.target.closest('.btn-pkg-plus')) {
                const pkgId = e.target.closest('[data-pkg-id]').getAttribute('data-pkg-id');
                const pkg = this.state.packages.find(p => p.id === pkgId);
                if (pkg) this.updatePackageQty(pkgId, (pkg.qty || 1) + 1);
                return;
            }
            if (e.target.closest('.btn-pkg-minus')) {
                const pkgId = e.target.closest('[data-pkg-id]').getAttribute('data-pkg-id');
                const pkg = this.state.packages.find(p => p.id === pkgId);
                if (pkg) this.updatePackageQty(pkgId, (pkg.qty || 1) - 1);
                return;
            }

            // Edit Package
            if (e.target.closest('.btn-edit-pkg')) {
                const pkgId = e.target.closest('[data-pkg-id]').getAttribute('data-pkg-id');
                const pkg = this.state.packages.find(p => p.id === pkgId);
                const newName = prompt("Masukkan nama paket baru:", pkg.name);
                if (newName) this.renamePackage(pkgId, newName);
                return;
            }

            // Delete Package
            if (e.target.closest('.btn-delete-pkg')) {
                const pkgId = e.target.closest('[data-pkg-id]').getAttribute('data-pkg-id');
                this.deletePackage(pkgId);
                return;
            }

            // Regular Item Logic
            const regularItemRow = e.target.closest('.regular-item');
            if (regularItemRow && !e.target.closest('.btn-pkg-plus') && !e.target.closest('.btn-pkg-minus')) {
                const id = regularItemRow.getAttribute('data-id');
                const item = this.state.regularItems.find(i => i.id === id);
                if (!item) return;

                if (e.target.closest('.btn-plus')) this.updateRegularItemQty(id, item.qty + 1);
                else if (e.target.closest('.btn-minus')) this.updateRegularItemQty(id, item.qty - 1);
                else if (e.target.closest('.remove-regular-btn')) this.removeRegularItem(id);
                return;
            }

            // Package Item Logic
            const pkgItemRow = e.target.closest('.pkg-item');
            if (pkgItemRow) {
                const pkgId = pkgItemRow.getAttribute('data-pkg-id');
                const itemId = pkgItemRow.getAttribute('data-id');
                const pkg = this.state.packages.find(p => p.id === pkgId);
                const item = pkg?.items.find(i => i.id === itemId);
                if (!item) return;

                if (e.target.closest('.btn-plus')) this.updateItemQtyInPackage(pkgId, itemId, item.qty + 1);
                else if (e.target.closest('.btn-minus')) this.updateItemQtyInPackage(pkgId, itemId, item.qty - 1);
            }
        });
    }
}

// Menghidupkan CartManager saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi CartManager agar bisa digunakan di semua halaman
    window.cart = new CartManager();
});