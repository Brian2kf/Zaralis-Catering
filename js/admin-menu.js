// js/admin-menu.js - Logika interaksi untuk halaman Manajemen Menu (Admin)

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. HALAMAN: DAFTAR MENU (menu.html)
    // ==========================================
    const deleteMenuBtns = document.querySelectorAll('.delete-menu-btn');
    
    deleteMenuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Konfirmasi sebelum menghapus
            if (confirm('Apakah Anda yakin ingin menghapus produk ini dari daftar menu? Tindakan ini tidak dapat dibatalkan.')) {
                // Hapus baris tabel tersebut dari tampilan (mockup)
                const row = btn.closest('tr');
                if (row) {
                    // Berikan efek transisi sebelum menghilang
                    row.style.transition = 'opacity 0.3s ease';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                    }, 300);
                }
            }
        });
    });

    // ==========================================
    // 2. HALAMAN: TAMBAH / EDIT MENU (Form)
    // ==========================================
    
    // A. Logika Hapus Gambar Galeri yang sudah ada
    // Event delegation digunakan agar tombol hapus yang dibuat dinamis via JS juga bisa berfungsi
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.remove-img-btn')) {
            e.preventDefault();
            if (confirm('Hapus foto ini dari galeri produk?')) {
                const imgContainer = e.target.closest('.col-6');
                if (imgContainer) {
                    imgContainer.remove();
                }
            }
        }
    });

    // B. Logika Simulasi Upload Gambar (Bisa banyak gambar dan nambah ke galeri)
    const uploadAreas = document.querySelectorAll('.image-upload-area');
    uploadAreas.forEach(area => {
        // Buat input file tersembunyi
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png, image/jpeg, image/jpg';
        // Memungkinkan upload multiple sekaligus (opsional, tapi disiapkan)
        fileInput.multiple = true; 
        fileInput.style.display = 'none';
        
        area.parentNode.appendChild(fileInput); // Sisipkan ke DOM

        // Jika area diklik, picu input file
        area.addEventListener('click', () => {
            fileInput.click();
        });

        // Efek drag and drop
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.style.backgroundColor = '#e7e9e5';
            area.style.borderColor = '#2D6A4F';
        });

        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            area.style.backgroundColor = '';
            area.style.borderColor = '';
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.backgroundColor = '';
            area.style.borderColor = '';
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                // Loop untuk menangani multiple file drag and drop
                Array.from(e.dataTransfer.files).forEach(file => {
                    handleFileUpload(file, area);
                });
            }
        });

        // Jika dipilih lewat file picker
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                Array.from(e.target.files).forEach(file => {
                    handleFileUpload(file, area);
                });
            }
            // Kosongkan value agar bisa upload gambar yang sama berturut-turut jika perlu
            fileInput.value = '';
        });
    });

    // Fungsi untuk menangani file yang diupload (Mockup Preview ditambahkan ke Galeri)
    function handleFileUpload(file, area) {
        // Cek ekstensi file
        if (!file.type.match('image.*')) {
            alert('Mohon hanya unggah file gambar (JPG/PNG).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // Cari kontainer galeri di form yang sama
            const galleryContainer = area.parentElement.querySelector('.row.g-2');
            
            if (galleryContainer) {
                // Jika kontainer galeri ada (baik di edit maupun tambah), append gambar sebagai grid item baru
                const newCol = document.createElement('div');
                newCol.className = 'col-6 position-relative';
                // HTML persis seperti struktur gambar di edit-menu.html
                newCol.innerHTML = `
                    <button type="button" class="remove-img-btn"><span class="material-symbols-outlined" style="font-size: 14px;">close</span></button>
                    <img src="${e.target.result}" alt="${file.name}" class="uploaded-image-preview">
                `;
                
                galleryContainer.appendChild(newCol);
            }
        }
        reader.readAsDataURL(file);
    }

    // C. Simulasi Simpan Form (Mengikat event klik langsung ke tombol ID yang relevan)
    const btnSimpanEdit = document.getElementById('btnSimpanEdit');
    const btnSimpanTambah = document.getElementById('btnSimpanTambah');
    const btnHapusEdit = document.getElementById('btnHapusEdit');

    const handleSave = (btn, isEdit) => {
        const menuName = document.getElementById('menuName');
        const category = document.getElementById('category');

        if (!menuName.value || !category.value) {
            alert('Mohon lengkapi Nama Menu dan Kategori sebelum menyimpan.');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        btn.disabled = true;

        setTimeout(() => {
            alert(isEdit ? 'Perubahan pada produk berhasil disimpan!' : 'Produk baru berhasil ditambahkan ke daftar menu!');
            window.location.href = 'menu.html';
        }, 1000);
    };

    if (btnSimpanEdit) {
        btnSimpanEdit.addEventListener('click', (e) => {
            e.preventDefault();
            handleSave(btnSimpanEdit, true);
        });
    }

    if (btnSimpanTambah) {
        btnSimpanTambah.addEventListener('click', (e) => {
            e.preventDefault();
            handleSave(btnSimpanTambah, false);
        });
    }

    // D. Simulasi Hapus Produk (Tombol Merah di Footer Edit)
    if (btnHapusEdit) {
        btnHapusEdit.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen?')) {
                alert('Produk berhasil dihapus dari sistem.');
                window.location.href = 'menu.html';
            }
        });
    }

});
