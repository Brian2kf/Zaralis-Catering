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
});

async function fetchOrderDetails(orderNumber) {
    try {
        const response = await fetch(`api/orders/show.php?order=${orderNumber}`);
        const data = await response.json();

        if (response.ok) {
            renderOrderDetails(data);
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

function renderOrderDetails(order) {
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
