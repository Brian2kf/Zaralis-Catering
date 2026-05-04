// js/admin/admin-menu.js - Logika interaksi untuk halaman Manajemen Menu (Admin)

document.addEventListener("DOMContentLoaded", () => {

    // Konfigurasi Path (Relatif terhadap file HTML di folder /admin)
    const API_BASE = "../api/admin/products/";
    const ASSETS_BASE = "../assets/";

    // ==========================================
    // 1. HALAMAN: DAFTAR MENU (menu.php)
    // ==========================================
    const menuTableBody = document.getElementById('menuTableBody');
    if (menuTableBody) {
        let currentPage = 1;

        const loadProducts = async (page = 1) => {
            try {
                menuTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><span class="spinner-border text-primary"></span><p class="mt-2 text-muted">Memuat data produk...</p></td></tr>';

                const response = await fetch(`${API_BASE}index.php?page=${page}&per_page=10`);
                const result = await response.json();

                if (result.success) {
                    renderStats(result.stats);
                    renderTable(result.products);
                    renderPagination(result.pagination);
                    currentPage = result.pagination.page;
                } else {
                    menuTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Gagal memuat data: ${result.message}</td></tr>`;
                }
            } catch (error) {
                console.error("Error loading products:", error);
                menuTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Terjadi kesalahan pada server.</td></tr>';
            }
        };

        const renderStats = (stats) => {
            document.getElementById('statTotalItem').textContent = `${stats.total_all} Produk`;
            document.getElementById('statBestSeller').textContent = stats.best_seller;

            if (stats.last_updated) {
                const date = new Date(stats.last_updated);
                const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                document.getElementById('statLastUpdate').textContent = formatter.format(date);
            } else {
                document.getElementById('statLastUpdate').textContent = '-';
            }
        };

        const formatRupiah = (number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
        };

        const formatCategory = (cat) => {
            if (cat === 'kue_satuan') return 'Kue Satuan';
            if (cat === 'paket_besar') return 'Paket Besar';
            return cat;
        };

        const renderTable = (products) => {
            menuTableBody.innerHTML = '';

            if (products.length === 0) {
                menuTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada produk.</td></tr>';
                return;
            }

            products.forEach(product => {
                const imgPath = product.image ? `../${product.image}` : `${ASSETS_BASE}images/placeholder.jpg`;
                const badgeClass = product.category === 'paket_besar' ? 'badge-soft-secondary' : 'badge-soft-primary';

                const tr = document.createElement('tr');
                tr.className = 'border-bottom';
                tr.innerHTML = `
                    <td class="p-4">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${imgPath}" alt="${product.name}" class="menu-img-thumb" style="object-fit: cover;">
                            <div>
                                <div class="fw-semibold text-dark">${product.name}</div>
                                <div class="text-muted small">${product.description ? product.description.substring(0, 50) + (product.description.length > 50 ? '...' : '') : '-'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4">
                        <span class="badge rounded-pill ${badgeClass} px-3 py-1 fw-medium">${formatCategory(product.category)}</span>
                    </td>
                    <td class="p-4 fw-medium text-dark">${formatRupiah(product.price)}</td>
                    <td class="p-4 text-end">
                        <div class="d-flex justify-content-end gap-2">
                            <a href="edit-menu.php?id=${product.id}" class="btn btn-sm btn-light border-0 text-muted p-1 hover-primary text-decoration-none" title="Edit Item">
                                <span class="material-symbols-outlined">edit</span>
                            </a>
                            <button class="btn btn-sm btn-light border-0 text-muted p-1 hover-danger delete-menu-btn" title="Hapus Item" data-id="${product.id}">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </td>
                `;
                menuTableBody.appendChild(tr);
            });

            // Bind delete events
            document.querySelectorAll('.delete-menu-btn').forEach(btn => {
                btn.addEventListener('click', handleDelete);
            });
        };

        const renderPagination = (pagination) => {
            const paginationText = document.getElementById('paginationText');
            const paginationContainer = document.getElementById('paginationContainer');

            const startItem = ((pagination.page - 1) * pagination.per_page) + 1;
            const endItem = Math.min(pagination.page * pagination.per_page, pagination.total_rows);

            if (pagination.total_rows === 0) {
                paginationText.textContent = 'Menampilkan 0 produk';
                paginationContainer.innerHTML = '';
                return;
            }

            paginationText.textContent = `Menampilkan ${startItem}-${endItem} dari ${pagination.total_rows} produk`;

            let paginationHtml = '';

            // Prev button
            paginationHtml += `
                <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center" 
                    style="width: 32px; height: 32px;" ${pagination.page === 1 ? 'disabled' : ''} onclick="window.changeProductPage(${pagination.page - 1})">
                    <span class="material-symbols-outlined" style="font-size: 18px; ${pagination.page === 1 ? 'color: #ccc;' : 'color: #333;'}">chevron_left</span>
                </button>
            `;

            // Page numbers
            for (let i = 1; i <= pagination.total_pages; i++) {
                if (i === pagination.page) {
                    paginationHtml += `<button class="btn btn-sm btn-primary-custom text-white fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">${i}</button>`;
                } else {
                    paginationHtml += `<button class="btn btn-sm btn-light border bg-white text-dark fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;" onclick="window.changeProductPage(${i})">${i}</button>`;
                }
            }

            // Next button
            paginationHtml += `
                <button class="btn btn-sm btn-light border bg-white text-dark d-flex align-items-center justify-content-center" 
                    style="width: 32px; height: 32px;" ${pagination.page === pagination.total_pages ? 'disabled' : ''} onclick="window.changeProductPage(${pagination.page + 1})">
                    <span class="material-symbols-outlined" style="font-size: 18px; ${pagination.page === pagination.total_pages ? 'color: #ccc;' : 'color: #333;'}">chevron_right</span>
                </button>
            `;

            paginationContainer.innerHTML = paginationHtml;
        };

        // Expose to window for inline onclick handler
        window.changeProductPage = (page) => {
            loadProducts(page);
        };

        const handleDelete = async (e) => {
            e.preventDefault();
            const btn = e.currentTarget;
            const productId = btn.getAttribute('data-id');

            if (confirm('Apakah Anda yakin ingin menghapus produk ini dari daftar menu? Tindakan ini tidak dapat dibatalkan.')) {
                try {
                    const response = await fetch(`${API_BASE}destroy.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: productId })
                    });

                    const result = await response.json();

                    if (result.success) {
                        const row = btn.closest('tr');
                        row.style.transition = 'opacity 0.3s ease';
                        row.style.opacity = '0';
                        setTimeout(() => { row.remove(); }, 300);
                    } else {
                        alert('Gagal menghapus: ' + (result.message || 'Error server.'));
                    }
                } catch (err) {
                    console.error(err);
                    alert('Gagal menghubungi server.');
                }
            }
        };

        // Initialize fetch
        loadProducts();
    }

    // ==========================================
    // 2. HALAMAN: EDIT MENU (edit-menu.php)
    // ==========================================
    const editFormWrapper = document.getElementById('editFormWrapper');
    if (editFormWrapper) {
        // Ambil ID dari query string
        const params = new URLSearchParams(window.location.search);
        const productId = parseInt(params.get('id'));

        // Elemen-elemen form
        const formTitle = document.getElementById('editFormTitle');
        const loadingState = document.getElementById('editLoadingState');
        const errorState = document.getElementById('editErrorState');
        const formContent = document.getElementById('editFormContent');
        const menuName = document.getElementById('menuName');
        const category = document.getElementById('category');
        const price = document.getElementById('price');
        const description = document.getElementById('description');
        const statusSwitch = document.getElementById('statusSwitch');
        const galleryContainer = document.getElementById('galleryPreviewContainer');
        const uploadArea = document.querySelector('.image-upload-area');

        // Simpan gambar yang akan dihapus (untuk dikirim ke server saat save)
        let deletedImageIds = [];
        // Simpan file baru yang akan diupload
        let newImageFiles = [];

        // ---- Fungsi Helper ----
        const showLoading = () => {
            loadingState.classList.remove('d-none');
            errorState.classList.add('d-none');
            formContent.classList.add('d-none');
        };

        const showError = (msg) => {
            loadingState.classList.add('d-none');
            errorState.classList.remove('d-none');
            formContent.classList.add('d-none');
            document.getElementById('editErrorMessage').textContent = msg;
        };

        const showForm = () => {
            loadingState.classList.add('d-none');
            errorState.classList.add('d-none');
            formContent.classList.remove('d-none');
        };

        // ---- Validasi ID ----
        if (!productId || isNaN(productId) || productId <= 0) {
            showError('ID produk tidak valid. Silakan kembali ke halaman daftar menu.');
            return;
        }

        // ---- Fetch data produk dari show.php ----
        const loadProductForEdit = async () => {
            showLoading();
            try {
                const response = await fetch(`${API_BASE}show.php?id=${productId}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    showError(result.message || 'Produk tidak ditemukan.');
                    return;
                }

                fillForm(result.product);
                showForm();

            } catch (err) {
                console.error('Error loading product:', err);
                showError('Gagal memuat data produk. Periksa koneksi Anda dan coba lagi.');
            }
        };

        // ---- Isi semua field form dengan data dari API ----
        const fillForm = (product) => {
            // Update judul halaman
            if (formTitle) formTitle.textContent = `Edit: ${product.name}`;

            // Field teks
            menuName.value = product.name ?? '';
            category.value = product.category ?? '';
            price.value = product.price ?? '';
            description.value = product.description ?? '';

            // Toggle status aktif
            statusSwitch.checked = product.is_active;

            // Render galeri gambar dari database
            renderGallery(product.images);
        };

        // ---- Render galeri gambar yang sudah ada ----
        const renderGallery = (images) => {
            galleryContainer.innerHTML = '';

            if (!images || images.length === 0) return;

            images.forEach((img, index) => {
                const isPrimary = img.is_primary;
                // Gambar disimpan relatif dari root proyek, path ke folder admin perlu penyesuaian
                const imgSrc = `../${img.file_path}`;

                const col = document.createElement('div');
                col.className = 'col-6 position-relative';
                col.dataset.imageId = img.id;

                col.innerHTML = `
                    <button type="button" class="remove-img-btn" data-image-id="${img.id}">
                        <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
                    </button>
                    <img src="${imgSrc}" 
                         alt="Foto produk ${index + 1}" 
                         class="uploaded-image-preview ${isPrimary ? 'border-primary border-2' : ''}"
                         onerror="this.src='${ASSETS_BASE}images/placeholder.jpg'">
                    ${isPrimary ? '<span class="badge bg-primary position-absolute bottom-0 start-0 m-2" style="font-size: 0.6rem;">Utama</span>' : ''}
                `;

                galleryContainer.appendChild(col);
            });
        };

        // ---- Event: hapus gambar dari galeri ----
        // Menggunakan event delegation agar tombol hapus baru (file baru) juga berfungsi
        document.body.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-img-btn');
            if (!removeBtn) return;

            e.preventDefault();
            if (!confirm('Hapus foto ini dari galeri produk?')) return;

            const col = removeBtn.closest('.col-6');
            if (!col) return;

            // Jika gambar dari database, catat ID-nya untuk dihapus di server
            const imageId = removeBtn.dataset.imageId;
            if (imageId) {
                deletedImageIds.push(parseInt(imageId));
            }

            col.remove();
        });

        // ---- Upload gambar baru via area upload ----
        if (uploadArea) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/png, image/jpeg, image/jpg';
            fileInput.multiple = true;
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
                if (e.dataTransfer.files?.length > 0) {
                    Array.from(e.dataTransfer.files).forEach(f => addNewImagePreview(f));
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files?.length > 0) {
                    Array.from(e.target.files).forEach(f => addNewImagePreview(f));
                }
                fileInput.value = '';
            });
        }

        // ---- Tambah preview gambar baru ke galeri ----
        const addNewImagePreview = (file) => {
            // Validasi tipe file
            if (!file.type.match('image.*')) {
                alert('Mohon hanya unggah file gambar (JPG/PNG).');
                return;
            }

            // Validasi batas maksimal 4 gambar
            const currentCount = galleryContainer.querySelectorAll('.col-6').length;
            if (currentCount >= 4) {
                alert('Maksimal 4 foto per produk.');
                return;
            }

            // Simpan file ke array untuk dikirim saat save
            newImageFiles.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const col = document.createElement('div');
                col.className = 'col-6 position-relative';
                // Tandai sebagai gambar baru (belum ada di DB) — tidak punya data-image-id
                col.innerHTML = `
                    <button type="button" class="remove-img-btn" data-new-file="${file.name}">
                        <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
                    </button>
                    <img src="${e.target.result}" alt="${file.name}" class="uploaded-image-preview">
                    <span class="badge bg-success position-absolute bottom-0 start-0 m-2" style="font-size: 0.6rem;">Baru</span>
                `;
                galleryContainer.appendChild(col);
            };
            reader.readAsDataURL(file);
        };

        // ---- Simpan perubahan (btnSimpanEdit) ----
        const btnSimpanEdit = document.getElementById('btnSimpanEdit');
        if (btnSimpanEdit) {
            btnSimpanEdit.addEventListener('click', async (e) => {
                e.preventDefault();

                // Validasi
                if (!menuName.value.trim()) {
                    alert('Nama menu wajib diisi.');
                    menuName.focus();
                    return;
                }
                if (!category.value) {
                    alert('Kategori wajib dipilih.');
                    category.focus();
                    return;
                }
                if (!price.value || parseFloat(price.value) <= 0) {
                    alert('Harga harus diisi dan lebih dari 0.');
                    price.focus();
                    return;
                }

                // Loading state
                const originalHTML = btnSimpanEdit.innerHTML;
                btnSimpanEdit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
                btnSimpanEdit.disabled = true;

                try {
                    // Gunakan FormData agar bisa kirim file gambar baru sekaligus
                    const formData = new FormData();
                    formData.append('id', productId);
                    formData.append('name', menuName.value.trim());
                    formData.append('category', category.value);
                    formData.append('price', price.value);
                    formData.append('description', description.value.trim());
                    formData.append('is_active', statusSwitch.checked ? 1 : 0);

                    // Kirim ID gambar yang dihapus
                    deletedImageIds.forEach(imgId => {
                        formData.append('deleted_image_ids[]', imgId);
                    });

                    // Kirim file gambar baru
                    newImageFiles.forEach(file => {
                        formData.append('new_images[]', file);
                    });

                    const response = await fetch(`${API_BASE}update.php`, {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('Perubahan pada produk berhasil disimpan!');
                        window.location.href = 'menu.php';
                    } else {
                        alert('Gagal menyimpan: ' + (result.message || 'Error server.'));
                        btnSimpanEdit.innerHTML = originalHTML;
                        btnSimpanEdit.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Gagal menghubungi server. Periksa koneksi Anda.');
                    btnSimpanEdit.innerHTML = originalHTML;
                    btnSimpanEdit.disabled = false;
                }
            });
        }

        // ---- Hapus produk (btnHapusEdit) ----
        const btnHapusEdit = document.getElementById('btnHapusEdit');
        if (btnHapusEdit) {
            btnHapusEdit.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;

                const originalHTML = btnHapusEdit.innerHTML;
                btnHapusEdit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menghapus...';
                btnHapusEdit.disabled = true;

                try {
                    const response = await fetch(`${API_BASE}destroy.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: productId })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('Produk berhasil dihapus dari sistem.');
                        window.location.href = 'menu.php';
                    } else {
                        alert('Gagal menghapus: ' + (result.message || 'Error server.'));
                        btnHapusEdit.innerHTML = originalHTML;
                        btnHapusEdit.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Gagal menghubungi server.');
                    btnHapusEdit.innerHTML = originalHTML;
                    btnHapusEdit.disabled = false;
                }
            });
        }

        // ---- Mulai load data ----
        loadProductForEdit();
    }

    // ==========================================
    // 3. HALAMAN: TAMBAH MENU (tambah-menu.php)
    // ==========================================
    const addFormWrapper = document.getElementById('addFormWrapper');
    if (addFormWrapper) {
        let newImageFiles = [];

        // Upload gambar baru
        const uploadAreas = document.querySelectorAll('.image-upload-area');
        uploadAreas.forEach(area => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/png, image/jpeg, image/jpg';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            area.parentNode.appendChild(fileInput);

            area.addEventListener('click', () => fileInput.click());
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
                if (e.dataTransfer.files?.length > 0) {
                    Array.from(e.dataTransfer.files).forEach(f => handleFileUpload(f, area));
                }
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files?.length > 0) {
                    Array.from(e.target.files).forEach(f => handleFileUpload(f, area));
                }
                fileInput.value = '';
            });
        });

        function handleFileUpload(file, area) {
            if (!file.type.match('image.*')) {
                alert('Mohon hanya unggah file gambar (JPG/PNG).');
                return;
            }
            const galleryContainer = document.getElementById('galleryPreviewContainer');
            if (galleryContainer && galleryContainer.querySelectorAll('.col-6').length >= 4) {
                alert('Maksimal 4 foto per produk.');
                return;
            }

            // Simpan file ke array
            newImageFiles.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const newCol = document.createElement('div');
                newCol.className = 'col-6 position-relative';
                newCol.innerHTML = `
                    <button type="button" class="remove-img-btn" data-new-file="${file.name}"><span class="material-symbols-outlined" style="font-size: 14px;">close</span></button>
                    <img src="${e.target.result}" alt="${file.name}" class="uploaded-image-preview">
                    <span class="badge bg-success position-absolute bottom-0 start-0 m-2" style="font-size: 0.6rem;">Baru</span>
                `;
                if (galleryContainer) galleryContainer.appendChild(newCol);
            };
            reader.readAsDataURL(file);
        }

        // Hapus gambar pada form tambah
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-img-btn');
            if (btn && addFormWrapper.contains(btn)) {
                e.preventDefault();
                const fileName = btn.getAttribute('data-new-file');
                if (fileName && confirm('Hapus foto ini dari galeri produk?')) {
                    // Hapus dari array
                    newImageFiles = newImageFiles.filter(f => f.name !== fileName);
                    btn.closest('.col-6')?.remove();
                }
            }
        });

        // Simpan produk baru
        const btnSimpanTambah = document.getElementById('btnSimpanTambah');
        if (btnSimpanTambah) {
            btnSimpanTambah.addEventListener('click', async (e) => {
                e.preventDefault();
                const menuName = document.getElementById('menuName');
                const category = document.getElementById('category');
                const price = document.getElementById('price');
                const description = document.getElementById('description');
                const statusSwitch = document.getElementById('statusSwitch');

                if (!menuName.value.trim()) {
                    alert('Nama menu wajib diisi.');
                    menuName.focus();
                    return;
                }
                if (!category.value) {
                    alert('Kategori wajib dipilih.');
                    category.focus();
                    return;
                }
                if (!price.value || parseFloat(price.value) <= 0) {
                    alert('Harga harus diisi dan lebih dari 0.');
                    price.focus();
                    return;
                }

                const originalHTML = btnSimpanTambah.innerHTML;
                btnSimpanTambah.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
                btnSimpanTambah.disabled = true;

                try {
                    const formData = new FormData();
                    formData.append('name', menuName.value.trim());
                    formData.append('category', category.value);
                    formData.append('price', price.value);
                    formData.append('description', description.value.trim());
                    formData.append('is_active', statusSwitch.checked ? 1 : 0);

                    newImageFiles.forEach(file => {
                        formData.append('images[]', file);
                    });

                    const response = await fetch(`${API_BASE}store.php`, {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('Produk baru berhasil ditambahkan ke daftar menu!');
                        window.location.href = 'menu.php';
                    } else {
                        alert('Gagal menyimpan: ' + (result.message || 'Error server.'));
                        btnSimpanTambah.innerHTML = originalHTML;
                        btnSimpanTambah.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Gagal menghubungi server. Periksa koneksi Anda.');
                    btnSimpanTambah.innerHTML = originalHTML;
                    btnSimpanTambah.disabled = false;
                }
            });
        }
    }

});
