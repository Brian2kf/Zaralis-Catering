// js/admin-keuangan.js - Logika interaksi untuk halaman Keuangan (Admin)

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. HALAMAN: DASHBOARD KEUANGAN (keuangan.html)
    // ==========================================

    // Simulasi Filter Periode
    const periodeSelect = document.querySelector('select.form-select-sm');
    if (periodeSelect) {
        periodeSelect.addEventListener('change', (e) => {
            alert(`Menampilkan data keuangan untuk periode: ${e.target.value}`);
            // Di sistem nyata, ini akan memicu AJAX request untuk update chart & summary
        });
    }

    // Simulasi Filter Kategori di tabel
    const categoryFilter = document.querySelector('select.form-select.bg-light');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const selectedText = e.target.options[e.target.selectedIndex].text;
            if (e.target.value !== "") {
                alert(`Memfilter tabel transaksi untuk kategori: ${selectedText}`);
            }
        });
    }

    // Simulasi Tombol Filter Lainnya
    const btnFilterLainnya = document.querySelector('.btn-light.border.bg-white.d-flex.align-items-center.gap-2.fw-medium');
    if (btnFilterLainnya && btnFilterLainnya.textContent.includes('Filter Lainnya')) {
        btnFilterLainnya.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Akan membuka modal pop-up filter lanjutan (Range Tanggal, Rentang Harga, dll).');
        });
    }

    // ==========================================
    // 2. HALAMAN: TAMBAH TRANSAKSI (tambah-transaksi.html)
    // ==========================================

    // A. Logika Perubahan Pilihan Kategori Berdasarkan Tipe Transaksi
    const typeIncome = document.getElementById('typeIncome');
    const typeExpense = document.getElementById('typeExpense');
    const categorySelect = document.getElementById('category');

    if (typeIncome && typeExpense && categorySelect) {
        const updateCategories = () => {
            // Kosongkan opsi saat ini
            categorySelect.innerHTML = '<option value="" selected disabled>Pilih Kategori</option>';

            if (typeIncome.checked) {
                // Opsi untuk Pemasukan
                categorySelect.innerHTML += `
                    <option value="pesanan">Pendapatan Pesanan</option>
                    <option value="lainnya">Pemasukan Lainnya</option>
                `;
            } else if (typeExpense.checked) {
                // Opsi untuk Pengeluaran
                categorySelect.innerHTML += `
                    <option value="bahan">Bahan Baku</option>
                    <option value="operasional">Operasional</option>
                    <option value="lainnya">Pengeluaran Lainnya</option>
                `;
            }
        };

        // Pasang event listener pada radio buttons
        typeIncome.addEventListener('change', updateCategories);
        typeExpense.addEventListener('change', updateCategories);

        // Panggil sekali saat load untuk memastikan opsi sinkron dengan radio yang terpilih
        updateCategories();
    }

    // B. Logika Simulasi Upload Bukti Transaksi (Single Image)
    const uploadArea = document.querySelector('.image-upload-area');
    if (uploadArea && !window.location.pathname.includes('menu')) { // pastikan bukan di form menu
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg, image/jpg, application/pdf';
        fileInput.style.display = 'none';

        uploadArea.parentNode.appendChild(fileInput);

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

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
            // Jika PDF, tampilkan icon PDF saja
            if (file.type === 'application/pdf') {
                uploadArea.innerHTML = `
                    <span class="material-symbols-outlined text-danger mb-2" style="font-size: 3rem;">picture_as_pdf</span>
                    <p class="fw-semibold text-primary-custom mb-1" style="font-size: 0.875rem;">${file.name}</p>
                    <p class="text-muted small mb-0" style="font-size: 0.75rem;">File PDF berhasil dipilih</p>
                `;
                return;
            }

            // Jika Gambar, tampilkan preview
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    uploadArea.innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain; max-height: 250px; border-radius: 0.5rem;">
                        <div class="mt-2 text-center w-100">
                            <p class="text-primary-custom small fw-medium mb-0">${file.name}</p>
                            <p class="text-muted small mb-0" style="font-size: 0.7rem;">(Klik untuk mengganti)</p>
                        </div>
                    `;
                    uploadArea.style.padding = '1rem';
                }
                reader.readAsDataURL(file);
            } else {
                alert('Mohon hanya unggah file gambar atau PDF.');
            }
        }
    }

    // C. Simulasi Simpan Transaksi
    const btnSimpanTransaksi = document.getElementById('btnSimpanTransaksi');

    if (btnSimpanTransaksi) {
        btnSimpanTransaksi.addEventListener('click', (e) => {
            e.preventDefault();

            const transDate = document.getElementById('transDate');
            const category = document.getElementById('category');
            const amount = document.getElementById('amount');
            const description = document.getElementById('description');

            // Validasi Sederhana
            if (!transDate.value || !category.value || !amount.value || !description.value) {
                alert('Mohon lengkapi semua kolom form (Tanggal, Kategori, Nominal, dan Deskripsi).');
                return;
            }

            if (amount.value <= 0) {
                alert('Nominal transaksi harus lebih dari 0.');
                return;
            }

            // Menentukan tipe untuk notifikasi
            const isIncome = document.getElementById('typeIncome').checked;
            const typeStr = isIncome ? 'Pemasukan' : 'Pengeluaran';

            const originalText = btnSimpanTransaksi.innerHTML;
            btnSimpanTransaksi.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            btnSimpanTransaksi.disabled = true;

            setTimeout(() => {
                alert(`Data transaksi ${typeStr} berhasil dicatat!`);
                window.location.href = 'keuangan.html';
            }, 1000);
        });
    }

});
