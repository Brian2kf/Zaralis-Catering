// js/auth.js - Logika interaksi untuk halaman Login dan Register

// Global auth utilities
window.getCurrentUser = function() {
    try {
        const userStr = localStorage.getItem('zaralis_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch(e) {
        return null;
    }
};

window.logout = function(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('zaralis_user');
    window.location.href = 'index.php';
};

document.addEventListener("DOMContentLoaded", () => {
    const authForm = document.querySelector('.auth-body form');
    const submitBtn = document.querySelector('.auth-body form button[type="submit"]');

    if (authForm && submitBtn) {
        authForm.addEventListener('submit', (e) => {
            // Mencegah browser mengirimkan form secara default agar kita bisa jalankan animasi
            e.preventDefault();
            
            // Simpan teks asli tombol (MASUK atau DAFTAR SEKARANG)
            const originalText = submitBtn.innerHTML;
            // Deteksi apakah ini halaman login atau register dari teks tombol
            const isLogin = originalText.toLowerCase().includes('masuk') || originalText.toLowerCase().includes('login');
            
            // Ubah tombol jadi status memproses (loading)
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
            submitBtn.disabled = true;

            // Simulasi jeda waktu server (1.5 detik)
            setTimeout(() => {
                // Mengembalikan keadaan tombol (jaga-jaga jika redirect batal)
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                if (isLogin) {
                    // *** SIMULASI LOGIN ***
                    const emailInput = authForm.querySelector('input[type="email"]');
                    
                    // Jika email mengandung kata 'admin', arahkan ke dashboard admin
                    if (emailInput && emailInput.value.toLowerCase().includes('admin')) {
                        window.location.href = 'admin/index.php';
                    } 
                    // Jika email biasa, arahkan ke beranda (pura-puranya login sebagai pelanggan)
                    else {
                        const dummyUser = {
                            firstName: "Budi",
                            lastName: "Santoso",
                            email: emailInput ? emailInput.value : "budi@email.com",
                            phone: "081234567890"
                        };
                        localStorage.setItem('zaralis_user', JSON.stringify(dummyUser));
                        window.location.href = 'index.php';
                    }
                } else {
                    // *** SIMULASI REGISTER ***
                    alert('Registrasi berhasil! Silakan login dengan akun yang baru saja Anda buat.');
                    // Setelah daftar, arahkan pengguna ke halaman login
                    window.location.href = 'login.php';
                }
            }, 1500);
        });
    }
});

