document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("table tbody");
    const filterSelect = document.querySelector("select");
    const paginationButtons = document.getElementById("paginationButtons");
    const paginationInfo = document.getElementById("paginationInfo");
    const exportBtn = Array.from(document.querySelectorAll("button, a")).find(el => el.textContent.toLowerCase().includes("export"));

    let allOrders = [];
    let filteredOrders = [];
    let currentPage = 1;
    const itemsPerPage = 5;

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
                filteredOrders = [...allOrders]; // Salinan awal
                updateDashboardStats(result.data.stats);
                renderOrdersTable();
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
            'pending_payment': '<span class="badge rounded-pill bg-light text-dark border px-3 py-1 fw-medium"><span class="dot bg-secondary me-1"></span> Belum Bayar</span>',
            'pending_verification': '<span class="badge rounded-pill badge-soft-warning px-3 py-1 fw-medium"><span class="dot bg-warning me-1"></span> Verifikasi</span>',
            'processing': '<span class="badge rounded-pill badge-soft-info px-3 py-1 fw-medium"><span class="dot bg-info me-1"></span> Diproses</span>',
            'shipped': '<span class="badge rounded-pill badge-soft-primary px-3 py-1 fw-medium"><span class="dot bg-primary me-1"></span> Dikirim</span>',
            'completed': '<span class="badge rounded-pill badge-soft-success px-3 py-1 fw-medium"><span class="material-symbols-outlined fs-6 align-middle me-1">check_circle</span> Selesai</span>',
            'cancelled': '<span class="badge rounded-pill badge-soft-danger px-3 py-1 fw-medium"><span class="dot bg-danger me-1"></span> Batal</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    }

    function renderOrdersTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (filteredOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5">Tidak ada data pesanan ditemukan.</td></tr>';
            if (paginationInfo) paginationInfo.innerText = 'Menampilkan 0 data';
            if (paginationButtons) paginationButtons.innerHTML = '';
            return;
        }

        // Hitung slice data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredOrders.slice(startIndex, endIndex);

        paginatedData.forEach((order) => {
            const tr = document.createElement('tr');
            tr.className = "hover-row transition-all";
            tr.innerHTML = `
                <td class="py-3 px-4 fw-bold text-dark" style="font-size: 0.9rem;">
                    ${order.order_number}
                </td>
                <td class="py-3 px-4">
                    <div class="fw-bold text-dark mb-0" style="font-size: 0.9rem;">${order.customer_name}</div>
                    <div class="small text-muted" style="font-size: 0.75rem;">${order.customer_email || ''}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-dark fw-medium" style="font-size: 0.85rem;">${formatDate(order.created_at).split(',')[0]}</div>
                    <div class="small text-muted" style="font-size: 0.75rem;">${formatDate(order.created_at).split(',')[1] || ''}</div>
                </td>
                <td class="py-3 px-4 fw-bold text-primary-custom" style="font-size: 0.95rem;">${formatRp(order.total_amount)}</td>
                <td class="py-3 px-4">${getStatusBadge(order.status)}</td>
                <td class="py-3 px-4 text-end">
                    <div class="d-flex justify-content-end align-items-center gap-2">
                        ${getActionButtons(order)}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        renderPagination();
        bindActionEvents();
    }

    function renderPagination() {
        if (!paginationButtons || !paginationInfo) return;

        const totalItems = filteredOrders.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startRange = (currentPage - 1) * itemsPerPage + 1;
        const endRange = Math.min(currentPage * itemsPerPage, totalItems);

        paginationInfo.innerText = `Menampilkan ${startRange}-${endRange} dari ${totalItems} transaksi`;

        let html = '';
        
        // Tombol Prev
        html += `
            <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center" 
                style="width: 32px; height: 32px;" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                <span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>
            </button>
        `;

        // Tombol Halaman
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage;
            html += `
                <button class="btn btn-sm ${isActive ? 'btn-primary-custom text-white fw-bold' : 'btn-light border bg-white text-dark'} d-flex align-items-center justify-content-center" 
                    style="width: 32px; height: 32px;" onclick="changePage(${i})">${i}</button>
            `;
        }

        // Tombol Next
        html += `
            <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center" 
                style="width: 32px; height: 32px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                <span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>
            </button>
        `;

        paginationButtons.innerHTML = html;
    }

    // Fungsi global untuk dipanggil dari atribut onclick
    window.changePage = (page) => {
        currentPage = page;
        renderOrdersTable();
        // Scroll ke atas tabel
        document.querySelector('.content-card').scrollIntoView({ behavior: 'smooth' });
    };

    function getActionButtons(order) {
        const detailBtn = `<a href="detail-pesanan.php?id=${order.order_number}" class="btn btn-sm btn-light border d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" title="Lihat Detail"><span class="material-symbols-outlined fs-5">visibility</span></a>`;
        
        if (order.status === 'pending_payment' || order.status === 'pending_verification') {
            return `
                <button class="btn btn-sm btn-primary-custom fw-bold btn-verify px-3" data-id="${order.order_number}" style="font-size: 0.75rem;">Verifikasi</button>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" type="button" data-bs-toggle="dropdown">
                        <span class="material-symbols-outlined fs-5">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2" href="detail-pesanan.php?id=${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">visibility</span> Lihat Detail</a></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2 btn-print" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">print</span> Cetak Invoice</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger btn-cancel" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6">cancel</span> Batalkan</a></li>
                    </ul>
                </div>
            `;
        } else if (order.status !== 'completed' && order.status !== 'cancelled') {
            return `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-primary-custom dropdown-toggle d-flex align-items-center gap-1 px-3 fw-bold" type="button" data-bs-toggle="dropdown" style="font-size: 0.75rem;">
                        Status <span class="material-symbols-outlined fs-6">expand_more</span>
                    </button>
                    <ul class="dropdown-menu shadow-sm border-0">
                        <li><a class="dropdown-item btn-status-update py-2" href="#" data-id="${order.order_number}" data-status="processing">Set Diproses</a></li>
                        <li><a class="dropdown-item btn-status-update py-2" href="#" data-id="${order.order_number}" data-status="shipped">Set Dikirim</a></li>
                        <li><a class="dropdown-item btn-status-update py-2 fw-bold text-success" href="#" data-id="${order.order_number}" data-status="completed">Set Selesai</a></li>
                    </ul>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" type="button" data-bs-toggle="dropdown">
                        <span class="material-symbols-outlined fs-5">more_vert</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2" href="detail-pesanan.php?id=${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">visibility</span> Lihat Detail</a></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2 btn-print" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6 text-muted">print</span> Cetak Invoice</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger btn-cancel" href="#" data-id="${order.order_number}"><span class="material-symbols-outlined fs-6">cancel</span> Batalkan</a></li>
                    </ul>
                </div>
            `;
        } else {
            return `
                ${detailBtn}
                <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center btn-print" style="width: 32px; height: 32px;" data-id="${order.order_number}" title="Cetak Invoice">
                    <span class="material-symbols-outlined fs-5">print</span>
                </button>
            `;
        }
    }

    function bindActionEvents() {
        document.querySelectorAll('.btn-verify').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const orderId = btn.getAttribute('data-id');
                if (confirm(`Verifikasi pembayaran untuk pesanan ${orderId}?`)) {
                    updateOrderStatus(orderId, 'processing');
                }
            };
        });

        document.querySelectorAll('.btn-status-update').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const orderId = btn.getAttribute('data-id');
                const newStatus = btn.getAttribute('data-status');

                const statusLabels = { 'processing': 'Diproses', 'shipped': 'Dikirim', 'completed': 'Selesai' };
                if (confirm(`Ubah status pesanan ${orderId} menjadi ${statusLabels[newStatus]}?`)) {
                    updateOrderStatus(orderId, newStatus);
                }
            };
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const orderId = btn.getAttribute('data-id');
                if (confirm(`PERINGATAN: Apakah Anda yakin ingin membatalkan pesanan ${orderId}?`)) {
                    updateOrderStatus(orderId, 'cancelled');
                }
            };
        });

        document.querySelectorAll('.btn-print').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const orderId = btn.getAttribute('data-id');
                printInvoice(orderId);
            };
        });
    }

    async function updateOrderStatus(orderNumber, newStatus) {
        try {
            const response = await fetch('../api/admin/orders/update_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_number: orderNumber, status: newStatus })
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

    async function printInvoice(orderNumber) {
        try {
            const response = await fetch(`../api/orders/show.php?order=${orderNumber}`);
            if (!response.ok) throw new Error("Gagal mengambil data pesanan.");

            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message || "Gagal mengambil data pesanan.");
            const order = result.data;

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
                    <div class="header"><h1>Zarali's Catering</h1><p>Invoice Pembelian</p></div>
                    <div class="info-section">
                        <div class="info-box"><strong>Ditagihkan Kepada:</strong><br>${order.customer_name}<br>${order.customer_phone}<br>${order.customer_email}</div>
                        <div class="info-box" style="text-align: right;"><strong>No. Pesanan:</strong> ${order.order_number}<br><strong>Tanggal Pesanan:</strong> ${formatDate(order.created_at)}<br><strong>Status:</strong> ${order.status.toUpperCase()}</div>
                    </div>
                    <strong>Alamat Pengiriman:</strong><br>${order.delivery_street} No. ${order.delivery_house_number}, RT ${order.delivery_rt}/RW ${order.delivery_rw}<br>Kel. ${order.delivery_kelurahan}, Kec. ${order.delivery_kecamatan}, ${order.delivery_postal_code}<br><br>
                    <table><thead><tr><th>Deskripsi Item</th><th>Qty</th><th>Harga Satuan</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
                    <div class="totals"><table><tr><td>Subtotal:</td><td>${formatRp(order.subtotal)}</td></tr><tr><td>Biaya Pengiriman:</td><td>${formatRp(order.shipping_cost)}</td></tr><tr><td style="font-size: 1.2em; color: #e07a5f;"><strong>Total Tagihan:</strong></td><td style="font-size: 1.2em; color: #e07a5f;"><strong>${formatRp(order.total_amount)}</strong></td></tr></table></div>
                    <div class="footer"><p>Terima kasih telah memesan di Zarali's Catering.</p></div>
                    <script>window.onload = function() { window.print(); }</script>
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
            currentPage = 1; // Reset ke halaman 1 setiap ganti filter

            if (keyword === '' || keyword.includes('semua')) {
                filteredOrders = [...allOrders];
            } else {
                filteredOrders = allOrders.filter(order => {
                    if (keyword.includes('verifikasi') && order.status === 'pending_verification') return true;
                    if (keyword.includes('proses') && order.status === 'processing') return true;
                    if (keyword.includes('selesai') && order.status === 'completed') return true;
                    if (keyword.includes('batal') && order.status === 'cancelled') return true;
                    if (keyword.includes('bayar') && order.status === 'pending_payment') return true;
                    if (keyword.includes('kirim') && order.status === 'shipped') return true;
                    return false;
                });
            }
            renderOrdersTable();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (filteredOrders.length === 0) {
                alert('Tidak ada data pesanan untuk diekspor.');
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Nomor Pesanan,Nama Pelanggan,Tanggal Dibuat,Total Tagihan,Status\n";

            filteredOrders.forEach((order) => {
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