// js/admin-keuangan.js
// Halaman: keuangan.php — integrasi dengan API backend

document.addEventListener('DOMContentLoaded', () => {

    // ─────────────────────────────────────────────────────
    // BAGIAN A — DASHBOARD KEUANGAN (keuangan.php)
    // ─────────────────────────────────────────────────────

    const isDashboard = !!document.getElementById('cashFlowChart');

    if (isDashboard) {
        // ── Referensi elemen ─────────────────────────────
        const periodFilter = document.getElementById('periodFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const btnFilterLainnya = document.getElementById('btnFilterLainnya');
        const btnApplyFilter = document.getElementById('btnApplyFilter');
        const btnResetFilter = document.getElementById('btnResetFilter');
        const filterModal = new bootstrap.Modal(document.getElementById('filterModal'));

        // Stat card elements
        const statIncome = document.getElementById('statIncome');
        const statExpense = document.getElementById('statExpense');
        const statNetProfit = document.getElementById('statNetProfit');
        const chartPeriodLabel = document.getElementById('chartPeriodLabel');
        const chartSkeleton = document.getElementById('chartSkeleton');
        const recentTbody = document.getElementById('recentTransactionsBody');

        // State filter tambahan (dari modal)
        let extraFilter = {
            dateFrom: '',
            dateTo: '',
            type: '',
        };

        // ── Instance Chart.js ─────────────────────────────
        let cashFlowChart = null;

        // ── Helpers ───────────────────────────────────────

        /**
         * Format angka ke Rupiah.
         * @param {number} num
         * @returns {string}
         */
        function formatRupiah(num) {
            return 'Rp ' + Math.abs(num).toLocaleString('id-ID');
        }

        /**
         * Format tanggal DB (YYYY-MM-DD) → "2 Mei 2026"
         * @param {string} dateStr
         * @returns {string}
         */
        function formatTanggal(dateStr) {
            if (!dateStr) return '-';
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        /**
         * Terjemahkan nilai category dari DB ke label yang lebih ramah.
         * @param {string} cat
         * @returns {string}
         */
        function labelKategori(cat) {
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
        }

        // ── Render stat cards ─────────────────────────────

        function renderStats(summary) {
            statIncome.textContent = formatRupiah(summary.total_income);
            statExpense.textContent = formatRupiah(summary.total_expense);

            const profit = summary.net_profit;
            statNetProfit.textContent = (profit < 0 ? '-' : '') + formatRupiah(profit);
            statNetProfit.className = 'display-6 fw-bold mb-0 ' + (profit < 0 ? 'text-danger' : 'text-dark');
            statNetProfit.style.fontFamily = "'Outfit', sans-serif";
        }

        // ── Render grafik ─────────────────────────────────

        function renderChart(chart) {
            chartSkeleton.classList.add('d-none');
            chartSkeleton.classList.remove('d-flex');

            if (cashFlowChart) {
                cashFlowChart.destroy();
            }

            const ctx = document.getElementById('cashFlowChart').getContext('2d');
            cashFlowChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chart.labels,
                    datasets: [
                        {
                            label: 'Pemasukan',
                            data: chart.income,
                            borderColor: '#2D6A4F',
                            backgroundColor: 'rgba(45, 106, 79, 0.08)',
                            borderWidth: 3,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#2D6A4F',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'Pengeluaran',
                            data: chart.expense,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.06)',
                            borderWidth: 3,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#dc3545',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#374151',
                            bodyColor: '#6b7280',
                            borderColor: '#e5e7eb',
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                                label: (ctx) => ' ' + ctx.dataset.label + ': ' + formatRupiah(ctx.raw),
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#9ca3af',
                                font: { size: 12 },
                            },
                        },
                        y: {
                            grid: {
                                color: 'rgba(0,0,0,0.06)',
                                drawBorder: false,
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: { size: 11 },
                                callback: (val) => {
                                    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'jt';
                                    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'rb';
                                    return val;
                                },
                            },
                            beginAtZero: true,
                        },
                    },
                },
            });
        }

        // ── Render tabel transaksi terbaru ────────────────

        function renderRecentTransactions(transactions) {
            if (!transactions || transactions.length === 0) {
                recentTbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-5 text-center text-muted">
                            <span class="material-symbols-outlined d-block mb-2" style="font-size: 2.5rem; opacity: 0.4;">receipt_long</span>
                            Belum ada transaksi pada periode ini.
                        </td>
                    </tr>`;
                return;
            }

            recentTbody.innerHTML = transactions.map(t => {
                const isIncome = t.type === 'income';
                const iconColor = isIncome ? '#2D6A4F' : '#dc3545';
                const iconBg = isIncome ? 'rgba(45, 106, 79, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                const icon = isIncome ? 'arrow_downward' : 'arrow_upward';
                const amountCls = isIncome ? 'text-primary-custom' : 'text-danger';
                const amountStr = (isIncome ? '+ ' : '- ') + formatRupiah(t.amount);

                // Deskripsi: preferensikan order_number jika ada
                const description = t.order_number
                    ? `Pesanan #${t.order_number}`
                    : (t.description || '-');

                return `
                <tr>
                    <td class="p-4 text-dark">${formatTanggal(t.transaction_date)}</td>
                    <td class="p-4 text-dark">${description}</td>
                    <td class="p-4">
                        <span class="badge bg-light text-dark border px-2 py-1 fw-medium">${labelKategori(t.category)}</span>
                    </td>
                    <td class="p-4 text-end fw-semibold ${amountCls}">${amountStr}</td>
                    <td class="p-4 text-center">
                        <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
                            style="width: 24px; height: 24px; background-color: ${iconBg}; color: ${iconColor};"
                            title="${isIncome ? 'Pemasukan' : 'Pengeluaran'}">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">${icon}</span>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        // ── Tampilkan skeleton saat loading ──────────────

        function showSkeletons() {
            statIncome.innerHTML = '<span class="placeholder-glow"><span class="placeholder col-8"></span></span>';
            statExpense.innerHTML = '<span class="placeholder-glow"><span class="placeholder col-8"></span></span>';
            statNetProfit.innerHTML = '<span class="placeholder-glow"><span class="placeholder col-8"></span></span>';
            chartSkeleton.classList.remove('d-none');
            chartSkeleton.classList.add('d-flex');
            recentTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-muted">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        Memuat transaksi...
                    </td>
                </tr>`;
        }

        // ── Label periode ─────────────────────────────────

        function getPeriodLabel(period) {
            const map = {
                this_month: 'Bulan Ini',
                last_month: 'Bulan Lalu',
                this_year: 'Tahun Ini',
                custom: 'Rentang Custom',
            };
            return map[period] ?? period;
        }

        // ── Fetch utama ke dashboard.php ──────────────────

        async function loadDashboard() {
            showSkeletons();

            const period = periodFilter.value;
            const params = new URLSearchParams({ period });

            // Tambahkan filter tambahan dari modal jika ada
            if (extraFilter.dateFrom) params.set('date_from', extraFilter.dateFrom);
            if (extraFilter.dateTo) params.set('date_to', extraFilter.dateTo);

            try {
                const res = await fetch(`../api/admin/finance/dashboard.php?${params.toString()}`, {
                    credentials: 'include',
                });

                if (res.status === 401) {
                    alert('Sesi Anda telah berakhir. Silakan login kembali sebagai Admin.');
                    window.location.href = '../login.php';
                    return;
                }

                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.message || 'Gagal memuat data dashboard.');
                }

                // Update label periode di chart
                chartPeriodLabel.textContent = getPeriodLabel(data.period.label) +
                    ` (${formatTanggal(data.period.date_from)} – ${formatTanggal(data.period.date_to)})`;

                renderStats(data.summary);
                renderChart(data.chart);

                // Filter transaksi terbaru berdasarkan kategori yang dipilih
                let filtered = data.recent_transactions;
                const catVal = categoryFilter.value;
                if (catVal) {
                    filtered = filtered.filter(t => t.category === catVal);
                }
                // Filter tipe dari modal
                if (extraFilter.type) {
                    filtered = filtered.filter(t => t.type === extraFilter.type);
                }

                renderRecentTransactions(filtered);

            } catch (err) {
                console.error('Dashboard load error:', err);
                statIncome.textContent = 'Error';
                statExpense.textContent = 'Error';
                statNetProfit.textContent = 'Error';
                chartSkeleton.innerHTML = `<div class="text-center text-danger small"><span class="material-symbols-outlined d-block mb-1">error</span>${err.message}</div>`;
                recentTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-danger small">${err.message}</td></tr>`;
            }
        }

        // ── Event listeners ───────────────────────────────

        // Filter periode utama (header)
        periodFilter.addEventListener('change', loadDashboard);

        // Filter kategori (inline)
        categoryFilter.addEventListener('change', loadDashboard);

        // Tombol "Filter Lainnya" → buka modal
        btnFilterLainnya.addEventListener('click', () => {
            filterModal.show();
        });

        // Tombol "Terapkan Filter" di modal
        btnApplyFilter.addEventListener('click', () => {
            extraFilter.dateFrom = document.getElementById('filterDateFrom').value;
            extraFilter.dateTo = document.getElementById('filterDateTo').value;
            const typeRadio = document.querySelector('input[name="filterType"]:checked');
            extraFilter.type = typeRadio ? typeRadio.value : '';
            filterModal.hide();
            loadDashboard();
        });

        // Tombol "Reset" di modal
        btnResetFilter.addEventListener('click', () => {
            document.getElementById('filterDateFrom').value = '';
            document.getElementById('filterDateTo').value = '';
            document.getElementById('filterTypeAll').checked = true;
            extraFilter = { dateFrom: '', dateTo: '', type: '' };
            filterModal.hide();
            loadDashboard();
        });

        // ── Load pertama kali ─────────────────────────────
        loadDashboard();
    }

    // ─────────────────────────────────────────────────────
    // BAGIAN B — TAMBAH TRANSAKSI (tambah-transaksi.php)
    // ─────────────────────────────────────────────────────

    // A. Logika Perubahan Pilihan Kategori Berdasarkan Tipe Transaksi
    const typeIncome = document.getElementById('typeIncome');
    const typeExpense = document.getElementById('typeExpense');
    const categorySelect = document.getElementById('category');

    if (typeIncome && typeExpense && categorySelect) {
        const updateCategories = () => {
            categorySelect.innerHTML = '<option value="" selected disabled>Pilih Kategori</option>';

            if (typeIncome.checked) {
                categorySelect.innerHTML += `
                    <option value="pesanan">Pendapatan Pesanan</option>
                    <option value="layanan_tambahan">Layanan Tambahan</option>
                    <option value="lainnya_p">Pemasukan Lainnya</option>
                `;
            } else if (typeExpense.checked) {
                categorySelect.innerHTML += `
                    <option value="bahan_baku">Bahan Baku</option>
                    <option value="gaji_pegawai">Gaji Pegawai</option>
                    <option value="operasional">Operasional</option>
                    <option value="transportasi">Transportasi</option>
                    <option value="pemasaran">Pemasaran</option>
                    <option value="perlengkapan">Perlengkapan</option>
                    <option value="lainnya_x">Pengeluaran Lainnya</option>
                `;
            }
        };

        typeIncome.addEventListener('change', updateCategories);
        typeExpense.addEventListener('change', updateCategories);
        updateCategories();
    }

    // B. Logika Upload Bukti Transaksi (Single Image)
    const uploadArea = document.querySelector('.image-upload-area');
    if (uploadArea && !window.location.pathname.includes('menu')) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg, image/jpg, application/pdf';
        fileInput.style.display = 'none';

        uploadArea.parentNode.appendChild(fileInput);

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '#e7e9e5';
            uploadArea.style.borderColor = '#2D6A4F';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '';
            uploadArea.style.borderColor = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.backgroundColor = '';
            uploadArea.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleReceiptUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleReceiptUpload(e.target.files[0]);
            }
        });

        function handleReceiptUpload(file) {
            if (file.type === 'application/pdf') {
                uploadArea.innerHTML = `
                    <span class="material-symbols-outlined text-danger mb-2" style="font-size: 3rem;">picture_as_pdf</span>
                    <p class="fw-semibold text-primary-custom mb-1" style="font-size: 0.875rem;">${file.name}</p>
                    <p class="text-muted small mb-0" style="font-size: 0.75rem;">File PDF berhasil dipilih</p>
                `;
                return;
            }

            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadArea.innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain; max-height: 250px; border-radius: 0.5rem;">
                        <div class="mt-2 text-center w-100">
                            <p class="text-primary-custom small fw-medium mb-0">${file.name}</p>
                            <p class="text-muted small mb-0" style="font-size: 0.7rem;">(Klik untuk mengganti)</p>
                        </div>
                    `;
                    uploadArea.style.padding = '1rem';
                };
                reader.readAsDataURL(file);
            } else {
                alert('Mohon hanya unggah file gambar atau PDF.');
            }
        }
    }

    // C. Simpan Transaksi (Integrasi dengan API store.php)
    const btnSimpanTransaksi = document.getElementById('btnSimpanTransaksi');
    const formTransaksi = document.querySelector('form'); // Pastikan ini menargetkan form yang benar

    if (btnSimpanTransaksi) {
        btnSimpanTransaksi.addEventListener('click', async (e) => {
            e.preventDefault();

            const transDate = document.getElementById('transDate');
            const category = document.getElementById('category');
            const amount = document.getElementById('amount');
            const description = document.getElementById('description');
            const type = document.querySelector('input[name="type"]:checked');

            // Validasi Sederhana
            if (!transDate.value || !category.value || !amount.value || !description.value || !type) {
                alert('Mohon lengkapi semua kolom form (Tanggal, Kategori, Nominal, dan Deskripsi).');
                return;
            }

            if (parseFloat(amount.value) <= 0) {
                alert('Nominal transaksi harus lebih dari 0.');
                return;
            }

            const typeStr = type.value === 'income' ? 'Pemasukan' : 'Pengeluaran';

            // Siapkan FormData (agar bisa kirim file)
            const formData = new FormData();
            formData.append('type', type.value);
            formData.append('category', category.value);
            formData.append('amount', amount.value);
            formData.append('transaction_date', transDate.value);
            formData.append('description', description.value);

            // Ambil file dari fileInput yang kita buat di Bagian B
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                formData.append('receipt', fileInput.files[0]);
            }

            // UI Loading
            const originalText = btnSimpanTransaksi.innerHTML;
            btnSimpanTransaksi.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            btnSimpanTransaksi.disabled = true;

            try {
                const res = await fetch('../api/admin/finance/store.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.message || 'Gagal menyimpan transaksi.');
                }

                alert(`Data transaksi ${typeStr} berhasil dicatat!`);
                window.location.href = 'keuangan.php';

            } catch (err) {
                alert('Kesalahan: ' + err.message);
                btnSimpanTransaksi.innerHTML = originalText;
                btnSimpanTransaksi.disabled = false;
            }
        });
    }

});
