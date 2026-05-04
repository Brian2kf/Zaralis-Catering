document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');

    if (!orderId) {
        alert("ID Pesanan tidak ditemukan!");
        window.location.href = 'pembelian.php';
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
        paymentProofContainer: document.getElementById('paymentProofContainer')
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
            const response = await fetch(`api/orders/show.php?order=${orderId}`);
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = 'login.php';
                    return;
                }
                throw new Error("Gagal mengambil data pesanan.");
            }

            const result = await response.json();
            if(result.status === 'success') {
                populateData(result.data);
            } else {
                alert(result.message);
                window.location.href = 'pembelian.php';
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
        if (elements.deliveryAddress) elements.deliveryAddress.innerText = order.delivery_address || '-';
        if (elements.customerNotes) elements.customerNotes.innerText = order.order_notes ? `"${order.order_notes}"` : '"Tidak ada catatan"';

        let subtotal = 0;
        if(order.items) {
            order.items.forEach(item => subtotal += item.subtotal);
        }

        if (elements.subtotalText) elements.subtotalText.innerText = formatRp(subtotal);
        if (elements.shippingCostText) elements.shippingCostText.innerText = formatRp(order.shipping_cost);
        if (elements.totalAmountText) elements.totalAmountText.innerText = formatRp(order.total_amount);

        // Render Items
        renderItems(order.items);

        // Handle Payment Proof
        if (elements.paymentProofContainer) {
            if (order.payment && order.payment.proof) {
                elements.paymentProofContainer.innerHTML = `
                    <div class="border rounded-3 p-4 text-center bg-light transition-colors"
                        style="cursor: pointer;" title="Klik untuk melihat bukti pembayaran secara penuh"
                        onclick="window.open('uploads/payments/${order.payment.proof}', '_blank')">
                        <img src="uploads/payments/${order.payment.proof}" class="img-fluid rounded mb-2" style="max-height: 150px;">
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
    }

    function renderItems(items) {
        if (!elements.orderItemsTable) return;
        elements.orderItemsTable.innerHTML = '';

        if (items && items.length > 0) {
            items.forEach(item => {
                let icon = 'lunch_dining';
                if(item.type === 'kue_satuan' || item.type === 'paket_besar') {
                    icon = 'inventory_2';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="p-4">
                        <div class="d-flex align-items-center gap-3">
                            <div style="width: 48px; height: 48px; background-color: #f8faf6; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-outlined text-muted">${icon}</span>
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold text-dark">${item.name || '-'}</h6>
                                <small class="text-muted">${item.type === 'kue_satuan' ? 'Paket Custom' : 'Menu'}</small>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 text-center text-muted">${formatRp(item.price)}</td>
                    <td class="p-4 text-center fw-medium">${item.quantity}</td>
                    <td class="p-4 text-end fw-semibold text-dark">${formatRp(item.subtotal)}</td>
                `;
                elements.orderItemsTable.appendChild(tr);
            });
        } else {
            elements.orderItemsTable.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-muted">Tidak ada item</td></tr>';
        }
    }

    fetchOrderDetail();
});
