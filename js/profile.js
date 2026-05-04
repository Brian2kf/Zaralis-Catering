document.addEventListener("DOMContentLoaded", () => {
    const profileForm = document.getElementById('profileForm');
    const addressCardsContainer = document.getElementById('addressCardsContainer');
    const addressCountBadge = document.getElementById('addressCountBadge');
    const addressLimitMessage = document.getElementById('addressLimitMessage');
    const btnSaveAddress = document.getElementById('btnSaveAddress');
    const addressForm = document.getElementById('addressForm');
    const addressModal = new bootstrap.Modal(document.getElementById('addressModal'));

    const showToast = (message, isError = false) => {
        const toastEl = document.getElementById('profileToast');
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.textContent = message;
        toastEl.classList.remove('text-bg-success', 'text-bg-danger');
        toastEl.classList.add(isError ? 'text-bg-danger' : 'text-bg-success');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    };

    // --- 1. Load User Data ---
    async function loadProfile() {
        try {
            const response = await fetch('api/auth/status.php');
            const result = await response.json();

            if (result.logged_in) {
                document.getElementById('firstName').value = result.first_name || '';
                document.getElementById('lastName').value = result.last_name || '';
                document.getElementById('email').value = result.email || '';
                document.getElementById('phone').value = result.phone || '';
                
                document.getElementById('profileHeaderName').textContent = `${result.first_name} ${result.last_name}`;
                document.getElementById('profileHeaderEmail').textContent = result.email;
            }
        } catch (e) {
            console.error("Gagal load profil:", e);
        }
    }

    // --- 2. Load Addresses ---
    async function loadAddresses() {
        try {
            const response = await fetch('api/auth/addresses/list.php');
            const result = await response.json();

            if (result.success) {
                renderAddresses(result.addresses);
            }
        } catch (e) {
            console.error("Gagal load alamat:", e);
        }
    }

    function renderAddresses(addresses) {
        addressCountBadge.textContent = `${addresses.length}/3`;
        addressCardsContainer.innerHTML = '';

        if (addresses.length >= 3) {
            addressLimitMessage.classList.remove('d-none');
        } else {
            addressLimitMessage.classList.add('d-none');
            // Add "Add New" card if less than 3
            const addCard = document.createElement('div');
            addCard.className = 'col-md-6 col-xl-4';
            addCard.innerHTML = `
                <div class="address-card add-new-card d-flex flex-column align-items-center justify-content-center p-4 text-center h-100" 
                     style="cursor: pointer; border: 2px dashed rgba(0,0,0,0.1); background: transparent;"
                     data-bs-toggle="modal" data-bs-target="#addressModal">
                    <span class="material-symbols-outlined fs-1 text-muted mb-2">add_location_alt</span>
                    <h3 class="h6 fw-bold text-muted mb-0">Tambah Alamat Baru</h3>
                </div>
            `;
            addressCardsContainer.appendChild(addCard);
        }

        addresses.forEach(addr => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-xl-4';
            col.innerHTML = `
                <div class="address-card p-4 h-100 position-relative ${addr.is_main ? 'border-primary-custom bg-white shadow-sm' : 'bg-white opacity-75'}">
                    ${addr.is_main ? '<span class="badge bg-primary-custom position-absolute top-0 end-0 m-3 px-3 py-1">Utama</span>' : ''}
                    <h3 class="h6 fw-bold text-dark mb-1">${addr.street_name}</h3>
                    <p class="text-muted small mb-3">${addr.house_number}, RT ${addr.rt}/RW ${addr.rw}, Kel. ${addr.kelurahan}, Kec. ${addr.kecamatan}, ${addr.postal_code}</p>
                    
                    <div class="d-flex gap-2 mt-auto">
                        ${!addr.is_main ? `<button class="btn btn-sm btn-outline-primary-custom fw-semibold small set-main-btn" data-id="${addr.id}">Set Utama</button>` : ''}
                        <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none small delete-addr-btn" data-id="${addr.id}">Hapus</button>
                    </div>
                </div>
            `;
            addressCardsContainer.appendChild(col);
        });

        // Bind events
        document.querySelectorAll('.set-main-btn').forEach(btn => {
            btn.addEventListener('click', () => setMainAddress(btn.dataset.id));
        });
        document.querySelectorAll('.delete-addr-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteAddress(btn.dataset.id));
        });
    }

    // --- 3. Save Address ---
    btnSaveAddress.addEventListener('click', async () => {
        const payload = {
            street_name: document.getElementById('streetName').value.trim(),
            house_number: document.getElementById('houseNumber').value.trim(),
            rt: document.getElementById('rt').value.trim(),
            rw: document.getElementById('rw').value.trim(),
            kelurahan: document.getElementById('kelurahan').value.trim(),
            kecamatan: document.getElementById('kecamatan').value,
            postal_code: document.getElementById('postalCode').value.trim(),
            landmark: document.getElementById('landmark').value.trim()
        };

        if (!payload.street_name || !payload.house_number || !payload.kelurahan || !payload.kecamatan) {
            showToast("Harap lengkapi semua field bertanda *", true);
            return;
        }

        try {
            const response = await fetch('api/auth/addresses/add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success) {
                addressModal.hide();
                addressForm.reset();
                loadAddresses();
                showToast("Alamat berhasil ditambahkan!");
            } else {
                showToast(result.message, true);
            }
        } catch (e) {
            showToast("Gagal menyimpan alamat.", true);
        }
    });

    async function setMainAddress(id) {
        try {
            const response = await fetch('api/auth/addresses/set_main.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                loadAddresses();
                showToast("Alamat utama diperbarui.");
            }
        } catch (e) { }
    }

    async function deleteAddress(id) {
        if (!confirm("Hapus alamat ini dari daftar?")) return;
        try {
            const response = await fetch('api/auth/addresses/delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                loadAddresses();
                showToast("Alamat dihapus.");
            }
        } catch (e) { }
    }

    // --- 4. Update Profile Info ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        try {
            const response = await fetch('api/auth/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                showToast("Profil berhasil diperbarui!");
                loadProfile();
            } else {
                showToast(result.message, true);
            }
        } catch (e) {
            showToast("Terjadi kesalahan sistem.", true);
        }
    });

    loadProfile();
    loadAddresses();
});
