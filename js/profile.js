// js/profile.js - Logika untuk halaman Profil dan Manajemen Alamat

document.addEventListener("DOMContentLoaded", () => {
    // Pastikan user sudah login, jika belum redirect ke index
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // --- DOM Elements ---
    const profileHeaderName = document.getElementById('profileHeaderName');
    const profileHeaderEmail = document.getElementById('profileHeaderEmail');
    const profileHeaderAvatar = document.getElementById('profileHeaderAvatar');
    
    const profileForm = document.getElementById('profileForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    const addressCardsContainer = document.getElementById('addressCardsContainer');
    const addressCountBadge = document.getElementById('addressCountBadge');
    const addressLimitMessage = document.getElementById('addressLimitMessage');
    
    const addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
    const addressForm = document.getElementById('addressForm');
    const btnSaveAddress = document.getElementById('btnSaveAddress');
    const addressIdInput = document.getElementById('addressId');
    
    // Toast
    const toastEl = document.getElementById('profileToast');
    const toast = new bootstrap.Toast(toastEl);
    const toastMessage = document.getElementById('toastMessage');

    // --- Inisialisasi Data ---
    function initProfile() {
        // Isi header
        profileHeaderName.textContent = `${user.firstName} ${user.lastName}`;
        profileHeaderEmail.textContent = user.email;
        const encodedName = encodeURIComponent(`${user.firstName} ${user.lastName}`);
        profileHeaderAvatar.src = `https://ui-avatars.com/api/?name=${encodedName}&background=fff&color=2D6A4F`;

        // Isi form
        firstNameInput.value = user.firstName;
        lastNameInput.value = user.lastName;
        emailInput.value = user.email;
        phoneInput.value = user.phone;

        renderAddresses();
    }

    // --- Manajemen Alamat ---
    function getAddresses() {
        try {
            const addrs = localStorage.getItem('zaralis_addresses');
            return addrs ? JSON.parse(addrs) : [];
        } catch(e) {
            return [];
        }
    }

    function saveAddresses(addresses) {
        localStorage.setItem('zaralis_addresses', JSON.stringify(addresses));
        renderAddresses();
    }

    function renderAddresses() {
        const addresses = getAddresses();
        addressCountBadge.textContent = `${addresses.length}/3`;
        
        // Cek limit
        if (addresses.length >= 3) {
            addressLimitMessage.classList.remove('d-none');
        } else {
            addressLimitMessage.classList.add('d-none');
        }

        let html = '';
        
        addresses.forEach(addr => {
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="address-card ${addr.isMain ? 'is-main' : ''}">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold fs-6 mb-0 text-dark">${addr.streetName}</h5>
                            ${addr.isMain ? '<span class="badge-utama">UTAMA</span>' : ''}
                        </div>
                        <p class="small text-muted mb-1">${addr.houseNumber}, RT ${addr.rt}/RW ${addr.rw}</p>
                        <p class="small text-muted mb-1">${addr.kelurahan}, Kec. ${addr.kecamatan}, ${addr.postalCode}</p>
                        ${addr.landmark ? `<p class="small text-muted mb-0 fst-italic">Patokan: ${addr.landmark}</p>` : ''}
                        
                        <div class="address-actions mt-3">
                            <button class="btn btn-sm btn-outline-secondary btn-address-action" onclick="editAddress('${addr.id}')">Edit</button>
                            ${!addr.isMain ? `<button class="btn btn-sm btn-outline-primary-custom btn-address-action" onclick="setMainAddress('${addr.id}')">Jadikan Utama</button>` : ''}
                            <button class="btn btn-sm btn-outline-danger btn-address-action ms-auto" onclick="deleteAddress('${addr.id}')">Hapus</button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Tambah card "Tambah Alamat" jika belum 3
        if (addresses.length < 3) {
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="add-address-card" onclick="openAddAddressModal()">
                        <span class="material-symbols-outlined fs-1 mb-2">add_circle</span>
                        <span class="fw-semibold">+ Tambah Alamat Baru</span>
                    </div>
                </div>
            `;
        }

        addressCardsContainer.innerHTML = html;
    }

    // Expose functions globally for inline onclick handlers
    window.openAddAddressModal = function() {
        addressForm.reset();
        addressForm.classList.remove('was-validated');
        addressIdInput.value = '';
        
        const addresses = getAddresses();
        // Jika ini alamat pertama, otomatis centang isMain
        document.getElementById('isMainAddress').checked = addresses.length === 0;
        
        document.getElementById('addressModalLabel').textContent = 'Tambah Alamat Baru';
        addressModal.show();
    };

    window.editAddress = function(id) {
        const addr = getAddresses().find(a => a.id === id);
        if (!addr) return;

        addressForm.reset();
        addressForm.classList.remove('was-validated');
        
        addressIdInput.value = addr.id;
        document.getElementById('streetName').value = addr.streetName;
        document.getElementById('houseNumber').value = addr.houseNumber;
        document.getElementById('rt').value = addr.rt;
        document.getElementById('rw').value = addr.rw;
        document.getElementById('kelurahan').value = addr.kelurahan;
        document.getElementById('kecamatan').value = addr.kecamatan;
        document.getElementById('postalCode').value = addr.postalCode;
        document.getElementById('landmark').value = addr.landmark || '';
        document.getElementById('isMainAddress').checked = addr.isMain;
        
        document.getElementById('addressModalLabel').textContent = 'Edit Alamat';
        addressModal.show();
    };

    window.deleteAddress = function(id) {
        if(confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
            let addresses = getAddresses();
            const addrToDelete = addresses.find(a => a.id === id);
            addresses = addresses.filter(a => a.id !== id);
            
            // Jika yang dihapus adalah alamat utama dan masih ada sisa alamat,
            // jadikan alamat pertama yang tersisa sebagai utama
            if (addrToDelete && addrToDelete.isMain && addresses.length > 0) {
                addresses[0].isMain = true;
            }
            
            saveAddresses(addresses);
            showToast('Alamat berhasil dihapus');
        }
    };

    window.setMainAddress = function(id) {
        let addresses = getAddresses();
        addresses = addresses.map(addr => ({
            ...addr,
            isMain: addr.id === id
        }));
        saveAddresses(addresses);
        showToast('Alamat utama berhasil diubah');
    };

    // --- Event Listeners ---
    
    // Simpan Profil
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!profileForm.checkValidity()) {
            e.stopPropagation();
            profileForm.classList.add('was-validated');
            return;
        }

        const updatedUser = {
            ...user,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            phone: phoneInput.value
            // email tidak diubah
        };

        localStorage.setItem('zaralis_user', JSON.stringify(updatedUser));
        
        // Update header navbar jika fungsi tersedia
        if (typeof window.populateAuthNavbar === 'function') {
            window.populateAuthNavbar();
        }

        // Update header halaman profil
        profileHeaderName.textContent = `${updatedUser.firstName} ${updatedUser.lastName}`;
        
        showToast('Profil berhasil diperbarui!');
    });

    // Simpan Alamat
    btnSaveAddress.addEventListener('click', () => {
        if (!addressForm.checkValidity()) {
            addressForm.classList.add('was-validated');
            return;
        }

        const isMain = document.getElementById('isMainAddress').checked;
        const newAddress = {
            id: addressIdInput.value || 'addr_' + Date.now().toString(36),
            streetName: document.getElementById('streetName').value,
            houseNumber: document.getElementById('houseNumber').value,
            rt: document.getElementById('rt').value,
            rw: document.getElementById('rw').value,
            kelurahan: document.getElementById('kelurahan').value,
            kecamatan: document.getElementById('kecamatan').value,
            postalCode: document.getElementById('postalCode').value,
            landmark: document.getElementById('landmark').value,
            isMain: isMain
        };

        let addresses = getAddresses();

        if (isMain) {
            // Unset other main addresses
            addresses = addresses.map(a => ({ ...a, isMain: false }));
        }

        if (addressIdInput.value) {
            // Update
            const index = addresses.findIndex(a => a.id === addressIdInput.value);
            if (index !== -1) {
                // Ensure at least one main address if it's the only one
                if (addresses.length === 1) newAddress.isMain = true;
                addresses[index] = newAddress;
            }
        } else {
            // Add new
            if (addresses.length >= 3) {
                alert('Maksimal 3 alamat.');
                return;
            }
            if (addresses.length === 0) {
                newAddress.isMain = true; // First address is always main
            }
            addresses.push(newAddress);
        }

        saveAddresses(addresses);
        addressModal.hide();
        showToast('Alamat berhasil disimpan!');
    });

    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.show();
    }

    // Init
    initProfile();
});
