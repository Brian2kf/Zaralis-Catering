// js/admin-pesanan.js - Logika interaksi untuk Manajemen Pesanan Admin

document.addEventListener("DOMContentLoaded", () => {
    
    // UTILITY: Format angka ke format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // ==========================================
    // 1. HALAMAN: TAMBAH PESANAN BARU
    // ==========================================
    const menuSelect = document.getElementById('menu_select');
    const qtyInput = document.getElementById('qty');
    const addBtn = document.querySelector('.order-summary-card .btn-outline-secondary-custom');
    const itemsContainer = document.querySelector('.order-summary-card .overflow-auto');
    const totalElement = document.querySelector('.order-summary-card .fs-3.fw-bold');
    const saveBtn = document.querySelector('.order-summary-card button[type="submit"]');
    
    // Array untuk menyimpan data item pesanan sementara di memori (frontend mockup)
    let selectedItems = [];

    // Fungsi Render Daftar Item yang Ditambahkan
    const renderItems = () => {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = ''; // Bersihkan kontainer
        
        if (selectedItems.length === 0) {
            itemsContainer.innerHTML = '<div class="d-flex h-100 align-items-center justify-content-center text-muted small">Belum ada menu yang dipilih.</div>';
            return;
        }

        selectedItems.forEach((item, index) => {
            const itemHTML = `
                <div class="order-item" data-index="${index}">
                    <div>
                        <div class="fw-medium text-dark">${item.name}</div>
                        <div class="text-muted small">${formatRupiah(item.price)} x ${item.qty}</div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="fw-semibold text-dark">${formatRupiah(item.subtotal)}</span>
                        <button type="button" class="btn btn-sm btn-link text-muted p-0 border-0 hover-danger delete-item-btn" title="Hapus Item">
                            <span class="material-symbols-outlined fs-5">delete</span>
                        </button>
                    </div>
                </div>
            `;
            itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Tambahkan event listener untuk semua tombol hapus (tong sampah)
        const deleteBtns = itemsContainer.querySelectorAll('.delete-item-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemDiv = e.target.closest('.order-item');
                const index = itemDiv.getAttribute('data-index');
                
                // Hapus item dari array dan render ulang HTML & Harga
                selectedItems.splice(index, 1);
                renderItems();
                updateTotal();
            });
        });
    };

    // Fungsi Mengkalkulasi Total Akhir
    const updateTotal = () => {
        if (!totalElement) return;
        const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
        totalElement.textContent = formatRupiah(total);
    };

    // Jika script berjalan di halaman tambah-pesanan.html
    if (addBtn && menuSelect && qtyInput) {
        
        // Membersihkan dummy content HTML agar logika murni dikendalikan JS dari awal
        renderItems();
        updateTotal();

        // Ketika tombol "Tambah" diklik
        addBtn.addEventListener('click', () => {
            if (!menuSelect.value) {
                alert('Silakan pilih hidangan terlebih dahulu dari dropdown.');
                return;
            }

            const selectedOption = menuSelect.options[menuSelect.selectedIndex];
            const name = selectedOption.text;
            // Mengambil harga dari atribut data-price yang baru disematkan di HTML
            const price = parseInt(selectedOption.getAttribute('data-price')) || 0; 
            const qty = parseInt(qtyInput.value) || 1;

            if (qty < 1) {
                alert('Jumlah pesanan minimal adalah 1.');
                return;
            }

            // Masukkan data ke array sementara
            selectedItems.push({
                name: name,
                price: price,
                qty: qty,
                subtotal: price * qty
            });

            // Reset pilihan dropdown & input qty agar siap pilih menu lainnya
            menuSelect.value = "";
            qtyInput.value = "1";

            // Update UI
            renderItems();
            updateTotal();
        });

        // Ketika tombol "Simpan Pesanan" diklik
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Validasi sederhana form detail pelanggan
                const firstName = document.getElementById('first_name').value;
                const phone = document.getElementById('phone').value;

                if (!firstName.trim() || !phone.trim()) {
                    alert('Mohon lengkapi minimal "Nama Depan" dan "No. HP" Pelanggan.');
                    return;
                }

                if (selectedItems.length === 0) {
                    alert('Mohon tambahkan minimal satu menu hidangan ke dalam daftar pesanan Anda.');
                    return;
                }

                // Efek loading saat menyimpan
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
                saveBtn.disabled = true;

                // Simulasi redirect kembali ke list pesanan
                setTimeout(() => {
                    alert('Sukses! Pesanan baru berhasil disimpan ke sistem.');
                    window.location.href = 'pesanan.html';
                }, 1000);
            });
        }
    }

    // ==========================================
    // 2. HALAMAN: DAFTAR PESANAN (pesanan.html)
    // ==========================================
    
    // Memberikan interaktivitas simulasi pada tombol tabel "Verifikasi" & "Status"
    const actionBtns = document.querySelectorAll('.table-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Cek apakah tombol yang diklik adalah tombol "Verifikasi" (memiliki class primary)
            if (btn.classList.contains('primary')) {
                if (confirm('Verifikasi pembayaran untuk pesanan ini? Aksi ini akan mengubah status pesanan.')) {
                    // Ubah wujud tombol Verifikasi menjadi tombol "Status" standar
                    btn.classList.remove('primary');
                    btn.innerHTML = 'Status <span class="material-symbols-outlined" style="font-size: 18px;">arrow_drop_down</span>';
                    
                    // Ubah wujud lencana/badge status pada tabel dari kuning ke biru (Diproses)
                    const tr = btn.closest('tr');
                    const badge = tr.querySelector('.badge');
                    if (badge) {
                        badge.className = 'badge rounded-pill badge-soft-info px-3 py-1';
                        badge.textContent = 'Diproses';
                    }
                }
            } else {
                // Simulasi memunculkan dropdown pilihan status standar
                alert('Tampilan Mockup: Dropdown untuk mengganti status (Diproses, Disiapkan, Dikirim, Selesai) akan muncul di sini saat Backend diterapkan.');
            }
        });
    });

});
