// js/order.js - Logika pelacakan status pesanan

document.addEventListener("DOMContentLoaded", () => {
    const trackBtn = document.querySelector('.track-card button');
    const resultAreas = document.querySelectorAll('.tracking-result-area');

    if (trackBtn) {
        trackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Mengambil input field
            const orderInput = document.querySelector('.track-card input[placeholder="e.g. CTR-..."]');
            const contactInput = document.querySelector('.track-card input[placeholder="Email atau 0812..."]');

            // Validasi sederhana
            if (!orderInput || !orderInput.value.trim() || !contactInput || !contactInput.value.trim()) {
                alert('Silakan lengkapi Nomor Order dan Email/Nomor HP Anda.');
                return;
            }

            // Simulasi proses pencarian (loading state)
            const originalText = trackBtn.innerHTML;
            trackBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Mencari...';
            trackBtn.disabled = true;

            // Simulasi jeda waktu server
            setTimeout(() => {
                // Tampilkan hasil pencarian
                resultAreas.forEach(area => {
                    area.classList.remove('d-none');
                    // Efek transisi muncul (fade-in)
                    area.style.opacity = '0';
                    setTimeout(() => {
                        area.style.transition = 'opacity 0.5s ease';
                        area.style.opacity = '1';
                    }, 50);
                });

                // Mengembalikan tombol ke state semula
                trackBtn.innerHTML = originalText;
                trackBtn.disabled = false;
                
                // Memperbarui Order ID pada hasil pencarian secara dinamis
                const orderIdSpan = document.querySelector('.summary-card .border-bottom:first-child .fw-bold');
                if (orderIdSpan) orderIdSpan.innerText = orderInput.value.toUpperCase();

            }, 1000); // 1 detik loading
        });
    }
});
