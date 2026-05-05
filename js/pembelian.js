document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector('.table-custom tbody');
    const paginationWrapper = document.querySelector('.pagination-wrapper');
    let allOrders = [];
    let currentFilter = 'Semua';
    let currentSubFilter = 'Semua';
    let currentPage = 1;
    const itemsPerPage = 5;

    // Elements
    const primaryBtns = document.querySelectorAll('.filter-btn');
    const secondaryContainer = document.querySelector('.flex-wrap.gap-2.ps-2'); // Sub-filter container
    const secondaryBtns = secondaryContainer ? secondaryContainer.querySelectorAll('.subfilter-btn') : [];

    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending_payment': '<span class="status-badge waiting"><span class="dot"></span> Belum Bayar</span>',
            'pending_verification': '<span class="status-badge waiting"><span class="dot"></span> Menunggu Verifikasi</span>',
            'processing': '<span class="status-badge process"><span class="dot"></span> Diproses</span>',
            'shipped': '<span class="status-badge process"><span class="dot"></span> Dikirim</span>',
            'completed': '<span class="status-badge success"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Berhasil</span>',
            'cancelled': '<span class="status-badge danger"><span class="dot"></span> Dibatalkan</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    };

    async function loadOrders() {
        try {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary-custom" role="status"></div><p class="mt-2 text-muted">Memuat riwayat pesanan...</p></td></tr>';

            const response = await fetch('api/orders/list_by_user.php');
            const result = await response.json();

            if (result.success) {
                allOrders = result.orders;
                applyFilters();
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">${result.message || 'Gagal memuat data.'}</td></tr>`;
            }
        } catch (error) {
            console.error("Error:", error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-danger">Terjadi kesalahan pada server.</td></tr>';
        }
    }

    function applyFilters() {
        let filtered = allOrders;

        if (currentFilter === 'Berlangsung') {
            // Jika sub-filter Selesai, kita masukkan status 'completed' ke dalam filter Berlangsung
            const targetStatuses = ['pending_payment', 'pending_verification', 'processing', 'shipped'];
            if (currentSubFilter === 'Selesai') targetStatuses.push('completed');
            
            filtered = filtered.filter(o => targetStatuses.includes(o.status));
            
            if (currentSubFilter === 'Menunggu Verifikasi') {
                filtered = filtered.filter(o => ['pending_payment', 'pending_verification'].includes(o.status));
            } else if (currentSubFilter === 'Diproses') {
                filtered = filtered.filter(o => o.status === 'processing');
            } else if (currentSubFilter === 'Dikirim') {
                filtered = filtered.filter(o => o.status === 'shipped');
            } else if (currentSubFilter === 'Selesai') {
                filtered = filtered.filter(o => o.status === 'completed');
            }
        } else if (currentFilter === 'Berhasil') {
            filtered = filtered.filter(o => o.status === 'completed');
        } else if (currentFilter === 'Tidak Berhasil') {
            filtered = filtered.filter(o => o.status === 'cancelled');
        }

        currentPage = 1; // Reset ke halaman pertama setiap filter berubah
        renderOrders(filtered);
    }

    function renderOrders(orders) {
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">Belum ada transaksi.</td></tr>';
            if (paginationWrapper) paginationWrapper.classList.add('d-none');
            return;
        }

        if (paginationWrapper) paginationWrapper.classList.remove('d-none');
        
        // Pagination Logic
        const totalItems = orders.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedOrders = orders.slice(startIndex, endIndex);

        tableBody.innerHTML = '';
        paginatedOrders.forEach(order => {
            const tr = document.createElement('tr');
            const mainItem = order.item_reg || order.item_pkg || '-';
            
            tr.innerHTML = `
                <td class="fw-bold text-primary-custom">${order.order_number}</td>
                <td class="text-muted">${formatDate(order.created_at)}</td>
                <td>${mainItem}</td>
                <td class="fw-bold text-secondary-custom" style="color: #E07A5F;">${formatRp(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td class="text-end">
                    <a href="detail-pembelian.php?order=${order.order_number}" class="action-btn" title="Lihat Detail">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </a>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        renderPagination(totalPages, startIndex + 1, endIndex, totalItems);
    }

    function renderPagination(totalPages, startRange, endRange, totalItems) {
        if (!paginationWrapper) return;

        const countSpan = paginationWrapper.querySelector('span');
        if (countSpan) countSpan.textContent = `Menampilkan ${startRange}-${endRange} dari ${totalItems} transaksi`;

        const btnContainer = paginationWrapper.querySelector('.d-flex.gap-1');
        if (!btnContainer) return;

        btnContainer.innerHTML = '';

        // Prev Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.disabled = currentPage === 1;
        prevBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilters(); // Re-apply current filters to use current data set
            }
        });
        btnContainer.appendChild(prevBtn);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                // Re-render without full filter re-run to maintain data set
                // But easier to just call applyFilters or a specific render function
                renderOrdersForCurrentPage();
            });
            btnContainer.appendChild(pageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderOrdersForCurrentPage();
            }
        });
        btnContainer.appendChild(nextBtn);
    }

    function renderOrdersForCurrentPage() {
        // Reuse applyFilters logic but don't reset currentPage
        let filtered = allOrders;
        if (currentFilter === 'Berlangsung') {
            const targetStatuses = ['pending_payment', 'pending_verification', 'processing', 'shipped'];
            if (currentSubFilter === 'Selesai') targetStatuses.push('completed');
            
            filtered = filtered.filter(o => targetStatuses.includes(o.status));
            
            if (currentSubFilter === 'Menunggu Verifikasi') {
                filtered = filtered.filter(o => ['pending_payment', 'pending_verification'].includes(o.status));
            } else if (currentSubFilter === 'Diproses') {
                filtered = filtered.filter(o => o.status === 'processing');
            } else if (currentSubFilter === 'Dikirim') {
                filtered = filtered.filter(o => o.status === 'shipped');
            } else if (currentSubFilter === 'Selesai') {
                filtered = filtered.filter(o => o.status === 'completed');
            }
        } else if (currentFilter === 'Berhasil') {
            filtered = filtered.filter(o => o.status === 'completed');
        } else if (currentFilter === 'Tidak Berhasil') {
            filtered = filtered.filter(o => o.status === 'cancelled');
        }
        renderOrders(filtered);
    }

    // Bind Filter Events
    const allFilterBtns = [...primaryBtns, ...secondaryBtns];

    allFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Hapus class active dari semua tombol
            allFilterBtns.forEach(b => {
                b.classList.remove('active');
                // Hapus ikon dari primary buttons jika ada
                const icon = b.querySelector('.material-symbols-outlined');
                if (icon && b.classList.contains('filter-btn')) icon.remove();
            });

            // Aktifkan tombol yang diklik
            btn.classList.add('active');
            
            const text = btn.textContent.replace('expand_more', '').trim();
            const isPrimary = [...primaryBtns].includes(btn);

            if (isPrimary) {
                currentFilter = text;
                currentSubFilter = 'Semua';

                if (currentFilter === 'Berlangsung') {
                    btn.innerHTML = 'Berlangsung <span class="material-symbols-outlined fs-6">expand_more</span>';
                    if (secondaryContainer) {
                        secondaryContainer.style.display = 'flex';
                        // Default sub-filter active is "Semua" or first? User said hide subfilters.
                        // We should probably deactivate all subfilters when switching primary.
                        secondaryBtns.forEach(sb => sb.classList.remove('active'));
                    }
                } else {
                    if (secondaryContainer) secondaryContainer.style.display = 'none';
                }
            } else {
                // Secondary button diklik
                currentFilter = 'Berlangsung'; // Parent-nya
                currentSubFilter = text;

                // Tetap tampilkan secondary container
                if (secondaryContainer) secondaryContainer.style.display = 'flex';

                // Pastikan parent 'Berlangsung' terlihat aktif secara visual jika diinginkan
                primaryBtns.forEach(pb => {
                    if (pb.textContent.includes('Berlangsung')) {
                        pb.classList.add('active');
                        if (!pb.querySelector('.material-symbols-outlined')) {
                            pb.innerHTML = 'Berlangsung <span class="material-symbols-outlined fs-6">expand_more</span>';
                        }
                    } else {
                        pb.classList.remove('active');
                    }
                });
            }

            applyFilters();
        });
    });

    loadOrders();
});
