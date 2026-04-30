// js/upload.js - Logika interaksi form Upload Bukti Pembayaran

document.addEventListener("DOMContentLoaded", () => {
    // 1. Logika untuk Drag & Drop Zona Upload
    const uploadZones = document.querySelectorAll('.upload-zone, .upload-zone-mini');
    
    uploadZones.forEach(zone => {
        const fileInput = zone.querySelector('input[type="file"]');
        // Mencari teks informasi untuk mengganti isinya dengan nama file
        const textElement = zone.querySelector('p.fw-medium') || zone.querySelector('p.text-primary-custom');
        
        if (!fileInput) return;

        // Buka dialog pilih file (otomatis tertangani oleh input absolute opacity 0 di CSS)

        // Event drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#2D6A4F'; // Ubah warna border saat file ditarik ke atas kotak
            zone.style.backgroundColor = 'rgba(45, 106, 79, 0.05)';
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.style.borderColor = ''; // Kembalikan ke warna css bawaan
            zone.style.backgroundColor = '';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.backgroundColor = '';
            
            // Masukkan file yang dijatuhkan ke dalam input file tersembunyi
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileName(e.dataTransfer.files[0].name);
            }
        });

        // Event saat file dipilih melalui dialog jendela konvensional
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                updateFileName(e.target.files[0].name);
            }
        });

        function updateFileName(name) {
            if (textElement) {
                textElement.innerHTML = `<span class="material-symbols-outlined fs-6 align-middle me-1">check_circle</span> ${name}`;
                textElement.classList.remove('text-muted', 'text-primary-custom');
                textElement.classList.add('text-success', 'fw-bold');
            }
            zone.style.borderColor = '#198754'; // Beri border hijau tanda sukses
        }
    });

    // 2. Simulasi Tombol Submit di halaman Upload Payment
    const submitBtn = document.querySelector('.form-card button');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const orderNo = document.getElementById('orderNo');
            const contact = document.getElementById('contact');
            const fileInput = document.querySelector('.upload-zone input[type="file"]');

            // Validasi Input (Pastikan semuanya terisi)
            if (!orderNo || !orderNo.value.trim() || !contact || !contact.value.trim()) {
                alert('Silakan lengkapi Nomor Order dan Email/No. HP terlebih dahulu.');
                return;
            }

            if (!fileInput || fileInput.files.length === 0) {
                alert('Silakan pilih atau tarik file bukti pembayaran Anda ke dalam kotak upload.');
                return;
            }

            // Simulasi loading unggah
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengunggah...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('Bukti pembayaran berhasil diunggah! Tim kami akan segera memverifikasi pesanan Anda.');
                // Mengarahkan ke halaman Beranda untuk alur Guest (tanpa login)
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    // 3. Logika Copy Nomor Rekening
    const btnCopyAccount = document.getElementById('btnCopyAccount');
    const accountNumber = document.getElementById('accountNumber');

    if (btnCopyAccount && accountNumber) {
        btnCopyAccount.addEventListener('click', () => {
            const textToCopy = accountNumber.innerText.replace(/\s/g, ''); // Hapus spasi untuk kemudahan paste di app bank
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Feedback visual sederhana
                const icon = btnCopyAccount.querySelector('.material-symbols-outlined');
                const originalIcon = icon.innerText;
                
                if (icon) {
                    icon.innerText = 'check';
                    
                    // Handle different button styles
                    const isPrimary = btnCopyAccount.classList.contains('text-primary-custom');
                    const isOutlineSecondary = btnCopyAccount.classList.contains('btn-outline-secondary-custom');
                    
                    if (isPrimary) btnCopyAccount.classList.replace('text-primary-custom', 'text-success');
                    if (isOutlineSecondary) {
                        btnCopyAccount.classList.replace('btn-outline-secondary-custom', 'btn-success');
                        btnCopyAccount.classList.replace('text-secondary-custom', 'text-white'); // Fallback check
                    }
                    
                    setTimeout(() => {
                        icon.innerText = originalIcon;
                        if (isPrimary) btnCopyAccount.classList.replace('text-success', 'text-primary-custom');
                        if (isOutlineSecondary) {
                            btnCopyAccount.classList.replace('btn-success', 'btn-outline-secondary-custom');
                        }
                    }, 2000);
                }
            }).catch(err => {
                console.error('Gagal menyalin teks: ', err);
            });
        });
    }
});
