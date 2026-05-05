document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        alert("ID Pesanan tidak ditemukan!");
        window.location.href = 'pesanan.php';
        return;
    }

    const elements = {
        orderNumber: document.getElementById('orderNumber'),
        orderStatusBadge: document.getElementById('orderStatusBadge'),
        orderDate: document.getElementById('orderDate'),
        orderItemsTable: document.getElementById('orderItemsTable'),
        subtotalText: document.getElementById('subtotalText'),
        shippingCostText: document.getElementById('shippingCostText'),
        totalAmountText: document.getElementById('totalAmountText'),
        customerName: document.getElementById('customerName'),
        customerEmail: document.getElementById('customerEmail'),
        customerPhone: document.getElementById('customerPhone'),
        deliverySchedule: document.getElementById('deliverySchedule'),
        deliveryAddress: document.getElementById('deliveryAddress'),
        customerNotes: document.getElementById('customerNotes'),
        paymentMethod: document.getElementById('paymentMethod'),
        paymentProofContainer: document.getElementById('paymentProofContainer'),
        btnVerify: document.getElementById('btnVerify'),
        btnReject: document.getElementById('btnReject')
    };

    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending_payment': '<span class="badge rounded-pill bg-light text-dark border px-3 py-1">Belum Bayar</span>',
            'pending_verification': '<span class="badge rounded-pill badge-soft-warning px-3 py-1">Menunggu Verifikasi</span>',
            'processing': '<span class="badge rounded-pill badge-soft-info px-3 py-1">Diproses</span>',
            'shipped': '<span class="badge rounded-pill badge-soft-primary px-3 py-1">Dikirim</span>',
            'completed': '<span class="badge rounded-pill badge-soft-success px-3 py-1">Selesai</span>',
            'cancelled': '<span class="badge rounded-pill badge-soft-danger px-3 py-1">Dibatalkan</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    };

    async function fetchOrderDetail() {
        try {
            const response = await fetch(`../api/orders/show.php?order=${orderId}`);
            if (!response.ok) throw new Error("Gagal mengambil data pesanan.");

            const result = await response.json();
            if (result.status === 'success') {
                populateData(result.data);
            } else {
                alert(result.message);
                window.location.href = 'pesanan.php';
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Gagal memuat detail pesanan.");
        }
    }

    function populateData(order) {
        if (elements.orderNumber) elements.orderNumber.innerText = `#${order.order_number}`;
        if (elements.orderStatusBadge) elements.orderStatusBadge.innerHTML = getStatusBadge(order.status);
        if (elements.orderDate) elements.orderDate.innerText = `Dipesan pada: ${formatDate(order.created_at)}`;

        if (elements.customerName) elements.customerName.innerText = order.customer_name || '-';
        if (elements.customerEmail) elements.customerEmail.innerText = order.customer_email || '-';
        if (elements.customerPhone) elements.customerPhone.innerText = order.customer_phone || '-';

        if (elements.deliverySchedule) elements.deliverySchedule.innerText = `${formatDate(order.delivery_date)} (${order.delivery_time || '-'})`;
        if (elements.deliveryAddress) elements.deliveryAddress.innerText = `${order.delivery_street} No. ${order.delivery_house_number}, RT ${order.delivery_rt}/RW ${order.delivery_rw}, Kel. ${order.delivery_kelurahan}, Kec. ${order.delivery_kecamatan}, ${order.delivery_postal_code}`;
        if (elements.customerNotes) elements.customerNotes.innerText = order.order_notes ? `"${order.order_notes}"` : '"Tidak ada catatan"';

        if (elements.subtotalText) elements.subtotalText.innerText = formatRp(order.subtotal);
        if (elements.shippingCostText) elements.shippingCostText.innerText = formatRp(order.shipping_cost);
        if (elements.totalAmountText) elements.totalAmountText.innerText = formatRp(order.total_amount);

        // Render Items
        renderItems(order);

        // Handle Payment Proof
        if (elements.paymentProofContainer) {
            if (order.payment_proof) {
                elements.paymentProofContainer.innerHTML = `
                    <div class="border rounded-3 p-4 text-center bg-light transition-colors"
                        style="cursor: pointer;" title="Klik untuk melihat bukti pembayaran secara penuh"
                        onclick="window.open('../${order.payment_proof}', '_blank')">
                        <img src="../${order.payment_proof}" class="img-fluid rounded mb-2" style="max-height: 150px;">
                        <p class="small text-primary-custom fw-medium mb-0 text-decoration-underline">Lihat Bukti Full</p>
                    </div>
                `;
            } else {
                elements.paymentProofContainer.innerHTML = `
                    <div class="border rounded-3 p-4 text-center bg-light">
                        <span class="material-symbols-outlined text-muted fs-1 mb-2">image_not_supported</span>
                        <p class="small text-muted fw-medium mb-0">Belum ada bukti upload</p>
                    </div>
                `;
            }
        }

        // Action Buttons Visibility
        if (elements.btnVerify && elements.btnReject) {
            // Reset visibility
            elements.btnVerify.classList.add('d-none');
            elements.btnReject.classList.add('d-none');

            // Show both buttons for pending_verification and pending_payment
            if (order.status === 'pending_verification' || order.status === 'pending_payment') {
                elements.btnVerify.classList.remove('d-none');
                elements.btnReject.classList.remove('d-none');
            }
        }
    }

    function renderItems(order) {
        if (!elements.orderItemsTable) return;
        elements.orderItemsTable.innerHTML = '';

        // Render Packages (Kue Satuan)
        if (order.packages && order.packages.length > 0) {
            order.packages.forEach(pkg => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="p-4">
                        <div class="d-flex align-items-center gap-3">
                            <div style="width: 48px; height: 48px; background-color: #f8faf6; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined text-muted">inventory_2</span>
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold text-dark">${pkg.package_name}</h6>
                                <small class="text-muted">${pkg.items.map(i => i.product_name_snapshot).join(', ')}</small>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 text-center text-muted">${formatRp(pkg.package_price)}</td>
                    <td class="p-4 text-center fw-medium">${pkg.quantity}</td>
                    <td class="p-4 text-end fw-semibold text-dark">${formatRp(pkg.package_price * pkg.quantity)}</td>
                `;
                elements.orderItemsTable.appendChild(tr);
            });
        }

        // Render Regular Items (Paket Besar)
        if (order.regular_items && order.regular_items.length > 0) {
            order.regular_items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="p-4">
                        <div class="d-flex align-items-center gap-3">
                            <div style="width: 48px; height: 48px; background-color: #f8faf6; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined text-muted">lunch_dining</span>
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold text-dark">${item.product_name_snapshot}</h6>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 text-center text-muted">${formatRp(item.product_price_snapshot)}</td>
                    <td class="p-4 text-center fw-medium">${item.quantity}</td>
                    <td class="p-4 text-end fw-semibold text-dark">${formatRp(item.subtotal)}</td>
                `;
                elements.orderItemsTable.appendChild(tr);
            });
        }
    }

    if (elements.btnVerify) {
        elements.btnVerify.addEventListener('click', () => {
            if (confirm(`Verifikasi pembayaran untuk pesanan ${orderId}?`)) {
                updateStatus('processing');
            }
        });
    }

    if (elements.btnReject) {
        elements.btnReject.addEventListener('click', () => {
            if (confirm(`Apakah Anda yakin ingin membatalkan/menolak pesanan ${orderId}?`)) {
                updateStatus('cancelled');
            }
        });
    }

    async function updateStatus(newStatus) {
        try {
            const response = await fetch('../api/admin/orders/update_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderId, status: newStatus })
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert("Status berhasil diperbarui!");
                window.location.reload();
            } else {
                alert("Gagal: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan.");
        }
    }

    fetchOrderDetail();
});
