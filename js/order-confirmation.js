let currentOrderData = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');

    if (!orderNumber) {
        alert("Nomor pesanan tidak ditemukan.");
        window.location.href = 'index.php';
        return;
    }

    fetchOrderDetails(orderNumber);

    // --- Logika Drag & Drop untuk Kotak Upload ---
    const uploadZone = document.querySelector('.upload-zone-mini');
    const fileInput = document.querySelector('.upload-input-hidden');
    const textElement = uploadZone ? uploadZone.querySelector('.text-primary-custom') : null;

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#2D6A4F';
            uploadZone.style.backgroundColor = 'rgba(45, 106, 79, 0.05)';
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.backgroundColor = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.backgroundColor = '';

            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileName(e.dataTransfer.files[0].name);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                updateFileName(e.target.files[0].name);
            }
        });

        function updateFileName(name) {
            if (textElement) {
                textElement.innerHTML = `<span class="material-symbols-outlined fs-6 align-middle me-1">check_circle</span> ${name}`;
                textElement.classList.remove('text-muted');
                textElement.classList.add('text-success', 'fw-bold');
            }
            uploadZone.style.borderColor = '#198754';
        }
    }

    // --- Logika API Upload Bukti Bayar ---
    const btnUpload = document.getElementById('btnUploadPaymentConfirm');
    if (btnUpload) {
        btnUpload.addEventListener('click', async (e) => {
            e.preventDefault();

            const orderNo = document.getElementById('orderNumberInput').value;
            if (!fileInput || fileInput.files.length === 0) {
                alert('Silakan pilih atau tarik file bukti pembayaran kamu ke dalam kotak upload.');
                return;
            }

            const originalText = btnUpload.innerHTML;
            btnUpload.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengunggah...';
            btnUpload.disabled = true;

            const formData = new FormData();
            formData.append('order_number', orderNo);
            formData.append('receipt', fileInput.files[0]);

            try {
                // Perhatikan URL path-nya, arahkan sesuai struktur folder
                const response = await fetch('/Zaralis-Catering/api/orders/upload-payment.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = 'index.php'; // Bisa arahkan ke pembelian.html jika user login
                } else {
                    alert("Gagal: " + result.message);
                    btnUpload.innerHTML = originalText;
                    btnUpload.disabled = false;
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Terjadi kesalahan saat menghubungi server.");
                btnUpload.innerHTML = originalText;
                btnUpload.disabled = false;
            }
        });
    }

    // --- Logika Cetak Invoice ---
    const btnPrint = document.getElementById('btnPrintInvoice');
    if (btnPrint) {
        btnPrint.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentOrderData) {
                printInvoice(currentOrderData);
            } else {
                alert("Data pesanan belum dimuat.");
            }
        });
    }
});

async function fetchOrderDetails(orderNumber) {
    try {
        const response = await fetch(`api/orders/show.php?order=${orderNumber}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            renderOrderDetails(data.data);
        } else {
            alert(data.message || "Pesanan tidak ditemukan.");
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
}

function formatRp(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function renderOrderDetails(order) {
    currentOrderData = order; // Simpan data untuk cetak invoice
    const orderNumberBadge = document.getElementById('orderNumberBadge');
    if (orderNumberBadge) orderNumberBadge.innerText = `Order No: ${order.order_number}`;

    const orderNumberInput = document.getElementById('orderNumberInput');
    if (orderNumberInput) orderNumberInput.value = order.order_number;

    const itemsContainer = document.getElementById('orderItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';

        // 1. Render Paket Satuan (order_packages)
        if (order.packages && order.packages.length > 0) {
            order.packages.forEach(pkg => {
                const html = `
                    <div class="receipt-item">
                        <div>
                            <p class="receipt-item-title">${pkg.package_name}</p>
                            <p class="receipt-item-desc">${pkg.quantity} Paket</p>
                        </div>
                        <span class="receipt-item-price">${formatRp(pkg.package_price * pkg.quantity)}</span>
                    </div>
                `;
                itemsContainer.insertAdjacentHTML('beforeend', html);
            });
        }

        // 2. Render Paket Besar (regular_items / order_items)
        if (order.regular_items && order.regular_items.length > 0) {
            order.regular_items.forEach(item => {
                const html = `
                    <div class="receipt-item">
                        <div>
                            <p class="receipt-item-title">${item.product_name_snapshot}</p>
                            <p class="receipt-item-desc">${item.quantity} Unit</p>
                        </div>
                        <span class="receipt-item-price">${formatRp(item.subtotal)}</span>
                    </div>
                `;
                itemsContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    const shippingCostText = document.getElementById('shippingCostText');
    if (shippingCostText) shippingCostText.innerText = formatRp(order.shipping_cost);

    const totalAmountText = document.getElementById('totalAmountText');
    if (totalAmountText) totalAmountText.innerText = formatRp(order.total_amount);
}

function printInvoice(order) {
    let invoiceWindow = window.open('', '_blank');
    let itemsHtml = '';

    if (order.packages) {
        order.packages.forEach(pkg => {
            itemsHtml += `<tr><td>${pkg.package_name}</td><td>${pkg.quantity}</td><td>${formatRp(pkg.package_price)}</td><td>${formatRp(pkg.package_price * pkg.quantity)}</td></tr>`;
        });
    }

    if (order.regular_items) {
        order.regular_items.forEach(item => {
            itemsHtml += `<tr><td>${item.product_name_snapshot}</td><td>${item.quantity}</td><td>${formatRp(item.product_price_snapshot)}</td><td>${formatRp(item.subtotal)}</td></tr>`;
        });
    }

    const htmlContent = `
        <html>
        <head>
            <title>Invoice - ${order.order_number}</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2d6a4f; padding-bottom: 15px; }
                .header h1 { color: #2d6a4f; margin: 0; font-family: 'Outfit', sans-serif; font-size: 2.5em; }
                .header p { margin: 5px 0 0; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
                .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .info-box { width: 48%; }
                .info-box strong { color: #2d6a4f; display: block; margin-bottom: 8px; font-size: 1.1em; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #eee; padding: 15px; text-align: left; }
                th { background-color: #f8faf6; color: #2d6a4f; font-weight: 700; text-transform: uppercase; font-size: 0.85em; }
                .totals { width: 40%; margin-left: auto; }
                .totals table { border: none; }
                .totals td { border: none; padding: 10px 0; }
                .totals td:last-child { text-align: right; font-weight: 700; }
                .total-row { color: #e07a5f; font-size: 1.4em; border-top: 2px solid #e07a5f !important; }
                .footer { margin-top: 60px; text-align: center; font-size: 0.9em; color: #888; border-top: 1px solid #eee; padding-top: 25px;}
                @media print {
                    @page { margin: 0; }
                    body { margin: 1.5cm; }
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="header">
                <h1>Zarali's Catering</h1>
                <p>Invoice Pembelian</p>
            </div>
            <div class="info-section">
                <div class="info-box">
                    <strong>Informasi Pelanggan:</strong>
                    ${order.customer_name}<br>
                    ${order.customer_phone}<br>
                    ${order.customer_email}
                </div>
                <div class="info-box" style="text-align: right;">
                    <strong>Detail Pesanan:</strong>
                    No. Pesanan: #${order.order_number}<br>
                    Tanggal: ${formatDate(order.created_at)}<br>
                    Status: <span style="color: #2d6a4f; font-weight: 700;">${order.status.toUpperCase()}</span>
                </div>
            </div>
            <div style="margin-bottom: 30px;">
                <strong>Alamat Pengiriman:</strong><br>
                ${order.delivery_address}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item / Paket</th>
                        <th style="width: 100px;">Qty</th>
                        <th>Harga</th>
                        <th style="width: 150px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="totals">
                <table>
                    <tr>
                        <td>Subtotal</td>
                        <td>${formatRp(order.subtotal)}</td>
                    </tr>
                    <tr>
                        <td>Biaya Pengiriman</td>
                        <td>${formatRp(order.shipping_cost)}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>Total Tagihan</strong></td>
                        <td><strong>${formatRp(order.total_amount)}</strong></td>
                    </tr>
                </table>
            </div>
            <div class="footer">
                <p>Terima kasih telah mempercayakan momen spesial Anda kepada Zarali's Catering.</p>
                <p style="font-size: 0.8em; margin-top: 10px;">Zarali's Catering &copy; 2024. All rights reserved.</p>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        // Optional: close window after print
                        // window.onafterprint = () => window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    invoiceWindow.document.write(htmlContent);
    invoiceWindow.document.close();
}
