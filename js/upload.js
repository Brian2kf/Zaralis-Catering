// js/upload.js - Logika interaksi form Upload Bukti Pembayaran

document.addEventListener("DOMContentLoaded", () => {
    // 1. Logika untuk Drag & Drop Zona Upload
    const uploadZones = document.querySelectorAll('.upload-zone, .upload-zone-mini');

    uploadZones.forEach(zone => {
        const fileInput = zone.querySelector('input[type="file"]');
        const textElement = zone.querySelector('p.fw-medium') || zone.querySelector('p.text-primary-custom');

        if (!fileInput) return;

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#2D6A4F';
            zone.style.backgroundColor = 'rgba(45, 106, 79, 0.05)';
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.backgroundColor = '';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.backgroundColor = '';

            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                updateFileName(e.dataTransfer.files[0].name);
            }
        });

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
            zone.style.borderColor = '#198754';
        }
    });

    // 2. API Upload Payment
    const submitBtn = document.querySelector('.form-card button');

    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Tombol upload diklik, memulai proses..."); // Indikator di Console

            const orderNo = document.getElementById('orderNo');
            const contact = document.getElementById('contact');
            const fileInput = document.querySelector('.upload-zone input[type="file"]');

            if (!orderNo || !orderNo.value.trim() || !contact || !contact.value.trim()) {
                alert('Silakan lengkapi Nomor Order dan Email atau No HP terlebih dahulu.');
                return;
            }

            if (!fileInput || fileInput.files.length === 0) {
                alert('Silakan pilih atau tarik file bukti pembayaran kamu ke dalam kotak upload.');
                return;
            }

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengunggah...';
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('order_number', orderNo.value.trim());
            formData.append('receipt', fileInput.files[0]);

            try {
                const response = await fetch('/Zaralis-Catering/api/orders/upload-payment.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = 'index.php';
                } else {
                    alert("Gagal: " + result.message);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Terjadi kesalahan saat menghubungi server.");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 3. Logika Copy Nomor Rekening
    const btnCopyAccount = document.getElementById('btnCopyAccount');
    const accountNumber = document.getElementById('accountNumber');

    if (btnCopyAccount && accountNumber) {
        btnCopyAccount.addEventListener('click', () => {
            const textToCopy = accountNumber.innerText.replace(/\s/g, '');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const icon = btnCopyAccount.querySelector('.material-symbols-outlined');
                const originalIcon = icon.innerText;

                if (icon) {
                    icon.innerText = 'check';
                    const isPrimary = btnCopyAccount.classList.contains('text-primary-custom');
                    const isOutlineSecondary = btnCopyAccount.classList.contains('btn-outline-secondary-custom');

                    if (isPrimary) btnCopyAccount.classList.replace('text-primary-custom', 'text-success');
                    if (isOutlineSecondary) {
                        btnCopyAccount.classList.replace('btn-outline-secondary-custom', 'btn-success');
                        btnCopyAccount.classList.replace('text-secondary-custom', 'text-white');
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