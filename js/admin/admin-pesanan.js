document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("table tbody");
    const filterSelect = document.querySelector("select");
    const exportBtn = Array.from(document.querySelectorAll("button, a")).find(el => el.textContent.toLowerCase().includes("export"));

    let allOrders = [];

    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    async function fetchOrdersData() {
        try {
            const response = await fetch('../api/admin/orders/index.php');
            const result = await response.json();

            if (result.status === 'success') {
                allOrders = result.data.orders;
                updateDashboardStats(result.data.stats);
                renderOrdersTable(allOrders);
            } else {
                console.error("Gagal mengambil data:", result.message);
            }
        } catch (error) {
            console.error("Error API:", error);
        }
    }

    function updateDashboardStats(stats) {
        const statTotal = document.getElementById('statTotal');
        const statPending = document.getElementById('statPending');
        const statProcessing = document.getElementById('statProcessing');
        const statCompleted = document.getElementById('statCompleted');

        if (statTotal) statTotal.innerText = stats.total;
        if (statPending) statPending.innerText = stats.menunggu_verifikasi;
        if (statProcessing) statProcessing.innerText = stats.diproses;
        if (statCompleted) statCompleted.innerText = stats.selesai_hari_ini;
    }

    function getStatusBadge(status) {
        const badges = {
            'pending_payment': '<span class="badge rounded-pill bg-light text-dark border px-3 py-1">Belum Bayar</span>',
            'pending_verification': '<span class="badge rounded-pill badge-soft-warning px-3 py-1">Menunggu Verifikasi</span>',
            'processing': '<span class="badge rounded-pill badge-soft-info px-3 py-1">Diproses</span>',
            'shipped': '<span class="badge rounded-pill badge-soft-primary px-3 py-1">Dikirim</span>',
            'completed': '<span class="badge rounded-pill badge-soft-success px-3 py-1">Selesai</span>',
            'cancelled': '<span class="badge rounded-pill badge-soft-danger px-3 py-1">Dibatalkan</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    function renderOrdersTable(ordersData) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (ordersData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada data pesanan ditemukan.</td></tr>';
            return;
        }

        ordersData.forEach((order) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="align-middle fw-bold text-dark">${order.order_number}</td>
                <td class="align-middle">${order.customer_name}</td>
                <td class="align-middle">${formatDate(order.created_at)}</td>
                <td class="align-middle fw-bold text-dark">${formatRp(order.total_amount)}</td>
                <td class="align-middle">
                    <a href="detail-pesanan.php?id=${order.order_number}" class="text-decoration-none text-success fw-medium d-flex align-items-center gap-1">
                        <span class="material-symbols-outlined fs-6">verified</span> Cek Bukti
                    </a>
                </td>
                <td class="align-middle">${getStatusBadge(order.status)}</td>
                <td class="align-middle text-end">
                    <div class="d-flex justify-content-end align-items-center gap-2">
                        ${getActionButtons(order)}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        bindActionEvents();
    }

    function getActionButtons(order) {
        if (order.status === 'pending_payment' || order.status === 'pending_verification') {
            return `
                <button class="btn btn-sm btn-outline-success btn-verify" data-id="${order.order_number}">Verifikasi</button>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center justify-content-center p-1" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined fs-6">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                        <li><a class="dropdown-item d-flex align-items-center gap-2" href="detail-pesanan.php?id=${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">visibility</span> Lihat Detail</a></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 btn-print" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">print</span> Cetak Invoice</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-cancel" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6">cancel</span> Batalkan Pesanan</a></li>
                    </ul>
                </div>
            `;
        } else if (order.status !== 'completed' && order.status !== 'cancelled') {
            return `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1 px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Status
                    </button>
                    <ul class="dropdown-menu shadow-sm border-0">
                        <li><a class="dropdown-item btn-status-update" href="#" data-id="${order.order_number}" data-status="processing">Set Diproses</a></li>
                        <li><a class="dropdown-item btn-status-update" href="#" data-id="${order.order_number}" data-status="shipped">Set Dikirim</a></li>
                        <li><a class="dropdown-item btn-status-update fw-bold text-success" href="#" data-id="${order.order_number}" data-status="completed">Set Selesai</a></li>
                    </ul>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center justify-content-center p-1" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="material-symbols-outlined fs-6">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                        <li><a class="dropdown-item d-flex align-items-center gap-2" href="detail-pesanan.php?id=${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">visibility</span> Lihat Detail</a></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 btn-print" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">print</span> Cetak Invoice</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-cancel" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6">cancel</span> Batalkan Pesanan</a></li>
                    </ul>
                </div>
            `;
        } else {
            return `
                <a href="detail-pesanan.php?id=${order.order_number}" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                    <span class="material-symbols-outlined fs-6">visibility</span> Detail
                </a>
            `;
        }
    }

    function bindActionEvents() {
        document.querySelectorAll('.btn-verify').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderId = e.target.getAttribute('data-id');
                if (confirm(`Verifikasi pembayaran untuk pesanan ${orderId}?`)) {
                    updateOrderStatus(orderId, 'processing');
                }
            });
        });

        document.querySelectorAll('.btn-status-update').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderId = e.target.getAttribute('data-id');
                const newStatus = e.target.getAttribute('data-status');

                const statusLabels = { 'processing': 'Diproses', 'shipped': 'Dikirim', 'completed': 'Selesai' };
                if (confirm(`Ubah status pesanan ${orderId} menjadi ${statusLabels[newStatus]}?`)) {
                    updateOrderStatus(orderId, newStatus);
                }
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderId = e.target.closest('a').getAttribute('data-id');
                if (confirm(`PERINGATAN: Apakah Anda yakin ingin membatalkan pesanan ${orderId}?`)) {
                    updateOrderStatus(orderId, 'cancelled');
                }
            });
        });

        // Event Listener untuk Tombol Cetak
        document.querySelectorAll('.btn-print').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const orderId = e.target.closest('a').getAttribute('data-id');
                printInvoice(orderId);
            });
        });
    }

    async function updateOrderStatus(orderNumber, newStatus) {
        try {
            const response = await fetch('../api/admin/orders/update_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_number: orderNumber,
                    status: newStatus
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert(`Sukses: ${result.message}`);
                fetchOrdersData();
            } else {
                alert("Gagal: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan saat menghubungi server.");
        }
    }

    // --- FUNGSI CETAK INVOICE ---
    async function printInvoice(orderNumber) {
        try {
            // Mengambil detail pesanan dari API show.php yang sudah ada
            const response = await fetch(`../api/orders/show.php?order=${orderNumber}`);

            if (!response.ok) {
                throw new Error("Gagal mengambil data pesanan.");
            }

            const order = await response.json();

            // Menyusun isi HTML untuk Invoice
            let invoiceWindow = window.open('', '_blank');
            let itemsHtml = '';

            // Tambahkan paket ke dalam tabel invoice
            if (order.packages) {
                order.packages.forEach(pkg => {
                    itemsHtml += `
                        <tr>
                            <td>${pkg.package_name}</td>
                            <td>${pkg.quantity}</td>
                            <td>${formatRp(pkg.package_price)}</td>
                            <td>${formatRp(pkg.package_price * pkg.quantity)}</td>
                        </tr>
                    `;
                });
            }

            // Tambahkan item reguler ke dalam tabel invoice
            if (order.regular_items) {
                order.regular_items.forEach(item => {
                    itemsHtml += `
                        <tr>
                            <td>${item.product_name_snapshot}</td>
                            <td>${item.quantity}</td>
                            <td>${formatRp(item.product_price_snapshot)}</td>
                            <td>${formatRp(item.subtotal)}</td>
                        </tr>
                    `;
                });
            }

            // Template HTML untuk jendela cetak
            const htmlContent = `
                <html>
                <head>
                    <title>Invoice - ${order.order_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2d6a4f; padding-bottom: 10px; }
                        .header h1 { color: #2d6a4f; margin: 0; }
                        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .info-box { width: 45%; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f8f9fa; color: #2d6a4f; }
                        .totals { width: 50%; margin-left: auto; }
                        .totals table { border: none; }
                        .totals td { border: none; padding: 8px; }
                        .totals td:last-child { text-align: right; font-weight: bold; }
                        .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #666; border-top: 1px solid #ddd; padding-top: 20px;}
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Zarali's Catering</h1>
                        <p>Invoice Pembelian</p>
                    </div>

                    <div class="info-section">
                        <div class="info-box">
                            <strong>Ditagihkan Kepada:</strong><br>
                            ${order.customer_name}<br>
                            ${order.customer_phone}<br>
                            ${order.customer_email}
                        </div>
                        <div class="info-box" style="text-align: right;">
                            <strong>No. Pesanan:</strong> ${order.order_number}<br>
                            <strong>Tanggal Pesanan:</strong> ${formatDate(order.created_at)}<br>
                            <strong>Status:</strong> ${order.status.toUpperCase()}
                        </div>
                    </div>

                    <strong>Alamat Pengiriman:</strong><br>
                    ${order.delivery_street} No. ${order.delivery_house_number}, RT ${order.delivery_rt}/RW ${order.delivery_rw}<br>
                    Kel. ${order.delivery_kelurahan}, Kec. ${order.delivery_kecamatan}, ${order.delivery_postal_code}<br><br>

                    <table>
                        <thead>
                            <tr>
                                <th>Deskripsi Item</th>
                                <th>Qty</th>
                                <th>Harga Satuan</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="totals">
                        <table>
                            <tr>
                                <td>Subtotal:</td>
                                <td>${formatRp(order.subtotal)}</td>
                            </tr>
                            <tr>
                                <td>Biaya Pengiriman:</td>
                                <td>${formatRp(order.shipping_cost)}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 1.2em; color: #e07a5f;"><strong>Total Tagihan:</strong></td>
                                <td style="font-size: 1.2em; color: #e07a5f;"><strong>${formatRp(order.total_amount)}</strong></td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer">
                        <p>Terima kasih telah memesan di Zarali's Catering.</p>
                    </div>
                    <script>
                        // Otomatis memicu dialog print saat jendela terbuka
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `;

            invoiceWindow.document.write(htmlContent);
            invoiceWindow.document.close();

        } catch (error) {
            console.error("Error Printing Invoice:", error);
            alert("Gagal memuat data untuk mencetak invoice.");
        }
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const keyword = e.target.value.toLowerCase();

            if (keyword === '' || keyword.includes('semua')) {
                renderOrdersTable(allOrders);
                return;
            }

            const filteredOrders = allOrders.filter(order => {
                if (keyword.includes('verifikasi') && order.status === 'pending_verification') return true;
                if (keyword.includes('proses') && order.status === 'processing') return true;
                if (keyword.includes('selesai') && order.status === 'completed') return true;
                if (keyword.includes('batal') && order.status === 'cancelled') return true;
                if (keyword.includes('bayar') && order.status === 'pending_payment') return true;
                if (keyword.includes('kirim') && order.status === 'shipped') return true;
                return false;
            });

            renderOrdersTable(filteredOrders);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (allOrders.length === 0) {
                alert('Tidak ada data pesanan untuk diekspor.');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Nomor Pesanan,Nama Pelanggan,Tanggal Dibuat,Total Tagihan,Status\n";

            allOrders.forEach((order) => {
                const safeName = `"${order.customer_name}"`;
                const row = `${order.order_number},${safeName},${order.created_at},${order.total_amount},${order.status}`;
                csvContent += row + "\r\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Data_Pesanan_Zaralis_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    fetchOrdersData();
});