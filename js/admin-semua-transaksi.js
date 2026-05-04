document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    const transactionsBody = document.getElementById('transactionsBody');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationNav = document.getElementById('paginationNav');

    // State
    let currentPage = 1;
    const limit = 10;
    let searchTimeout = null;

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    // Format Tanggal
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // Fetch Transactions
    const fetchTransactions = async () => {
        transactionsBody.innerHTML = `
            <tr>
                <td colspan="5" class="p-4 text-center text-muted">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Memuat transaksi...
                </td>
            </tr>
        `;

        try {
            // Build Query Params
            const params = new URLSearchParams({
                page: currentPage,
                limit: limit
            });

            if (searchInput.value.trim() !== '') {
                params.append('search', searchInput.value.trim());
            }

            if (categoryFilter.value !== '') {
                params.append('category', categoryFilter.value);
            }

            if (dateFilter.value !== '') {
                params.append('date_from', dateFilter.value);
                params.append('date_to', dateFilter.value); // Single date filter
            }

            const response = await fetch(`../api/admin/finance/transactions.php?${params.toString()}`);
            
            if (response.status === 401) {
                window.location.href = '../login.php';
                return;
            }

            const result = await response.json();

            if (result.success) {
                renderTable(result.transactions);
                renderPagination(result.pagination);
            } else {
                throw new Error(result.message || 'Gagal memuat data');
            }

        } catch (error) {
            console.error('Error fetching transactions:', error);
            transactionsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-danger">
                        Terjadi kesalahan saat memuat data: ${error.message}
                    </td>
                </tr>
            `;
        }
    };

    // Terjemahkan nilai category dari DB ke label yang lebih ramah.
    const labelKategori = (cat) => {
        const map = {
            // Pemasukan
            'pesanan': 'Pendapatan Pesanan',
            'layanan_tambahan': 'Layanan Tambahan',
            'lainnya_p': 'Pemasukan Lainnya',
            // Pengeluaran
            'bahan_baku': 'Bahan Baku',
            'gaji_pegawai': 'Gaji Pegawai',
            'operasional': 'Operasional',
            'transportasi': 'Transportasi',
            'pemasaran': 'Pemasaran',
            'perlengkapan': 'Perlengkapan',
            'lainnya_x': 'Pengeluaran Lainnya',
            // Fallback lama
            'bahan': 'Bahan Baku',
            'lainnya': 'Lainnya'
        };
        return map[cat] ?? cat;
    };

    // Render Table Body
    const renderTable = (data) => {
        if (!data || data.length === 0) {
            transactionsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-5 text-center text-muted">
                        <div class="d-flex flex-column align-items-center">
                            <span class="material-symbols-outlined fs-1 text-light mb-3">receipt_long</span>
                            <p class="mb-0">Tidak ada transaksi yang ditemukan.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        data.forEach(trx => {
            const isIncome = trx.type === 'income';
            
            // Format Amount
            const amountClass = isIncome ? 'text-primary-custom' : 'text-danger';
            const amountPrefix = isIncome ? '+' : '-';
            const formattedAmount = `${amountPrefix} ${formatRupiah(trx.amount)}`;

            // Icon
            const iconBg = isIncome ? 'rgba(45, 106, 79, 0.1)' : 'rgba(220, 53, 69, 0.1)';
            const iconColor = isIncome ? '#2D6A4F' : '#dc3545';
            const iconName = isIncome ? 'arrow_downward' : 'arrow_upward';
            const typeLabel = isIncome ? 'Pemasukan' : 'Pengeluaran';
            
            html += `
                <tr>
                    <td class="p-4 text-dark">${formatDate(trx.transaction_date)}</td>
                    <td class="p-4 text-dark">${trx.description}</td>
                    <td class="p-4">
                        <span class="badge bg-light text-dark border px-2 py-1 fw-medium">${labelKategori(trx.category)}</span>
                    </td>
                    <td class="p-4 text-end fw-semibold ${amountClass}">${formattedAmount}</td>
                    <td class="p-4 text-center">
                        <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
                            style="width: 24px; height: 24px; background-color: ${iconBg}; color: ${iconColor};"
                            title="${typeLabel}">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">${iconName}</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        transactionsBody.innerHTML = html;
    };

    // Render Pagination
    const renderPagination = (pagination) => {
        const { total_rows, total_pages, page, per_page } = pagination;

        // Info Text
        if (total_rows === 0) {
            paginationInfo.textContent = 'Menampilkan 0 hingga 0 dari 0 transaksi';
            paginationNav.innerHTML = '';
            return;
        }

        const startItem = ((page - 1) * per_page) + 1;
        const endItem = Math.min(page * per_page, total_rows);
        paginationInfo.textContent = `Menampilkan ${startItem} hingga ${endItem} dari ${total_rows} transaksi`;

        // Pagination Links
        let navHtml = '';

        // Prev Button
        const prevDisabled = page === 1 ? 'disabled' : '';
        navHtml += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link text-muted" href="#" aria-label="Previous" data-page="${page - 1}">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;

        // Page Numbers (Sederhana, menampilkan semua halaman atau maksimal 5 halaman)
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(total_pages, page + 2);

        if (startPage > 1) {
            navHtml += `<li class="page-item"><a class="page-link text-dark" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) navHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === page) {
                navHtml += `
                    <li class="page-item active">
                        <a class="page-link" href="#" style="background-color: #2D6A4F; border-color: #2D6A4F;" data-page="${i}">${i}</a>
                    </li>
                `;
            } else {
                navHtml += `
                    <li class="page-item">
                        <a class="page-link text-dark" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) navHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            navHtml += `<li class="page-item"><a class="page-link text-dark" href="#" data-page="${total_pages}">${total_pages}</a></li>`;
        }

        // Next Button
        const nextDisabled = page === total_pages ? 'disabled' : '';
        navHtml += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link text-dark" href="#" aria-label="Next" data-page="${page + 1}">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;

        paginationNav.innerHTML = navHtml;

        // Attach click events to pagination links
        const pageLinks = paginationNav.querySelectorAll('a.page-link');
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = link.parentElement;
                if (!parent.classList.contains('disabled') && !parent.classList.contains('active')) {
                    const newPage = parseInt(link.getAttribute('data-page'));
                    if (!isNaN(newPage)) {
                        currentPage = newPage;
                        fetchTransactions();
                    }
                }
            });
        });
    };

    // Event Listeners for Filters
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            fetchTransactions();
        }, 500); // Debounce 500ms
    });

    categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        fetchTransactions();
    });

    dateFilter.addEventListener('change', () => {
        currentPage = 1;
        fetchTransactions();
    });

    // Initial Load
    fetchTransactions();
});
