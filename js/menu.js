// js/menu.js - Logika filter & pencarian untuk halaman menu.html

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector('input[placeholder="Cari sajian..."]');
    const filterBtns = document.querySelectorAll('.chip-btn');
    const productItems = document.querySelectorAll('.product-item');

    // 1. Logika Pencarian
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            productItems.forEach(col => {
                const title = col.querySelector('h3').innerText.toLowerCase();
                const desc = col.querySelector('p').innerText.toLowerCase();
                
                if (title.includes(query) || desc.includes(query)) {
                    col.style.display = 'block';
                    setTimeout(() => col.style.opacity = '1', 50);
                } else {
                    col.style.opacity = '0';
                    setTimeout(() => col.style.display = 'none', 300);
                }
            });
        });
    }

    // 2. Logika Filter Kategori
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Hapus style aktif dari semua tombol
                filterBtns.forEach(b => {
                    b.classList.remove('btn-primary-custom', 'border-0', 'text-white');
                    b.classList.add('btn-light', 'border', 'text-muted');
                });
                
                // Tambahkan style aktif ke tombol yang diklik
                btn.classList.remove('btn-light', 'border', 'text-muted');
                btn.classList.add('btn-primary-custom', 'border-0', 'text-white');
                
                const targetCategory = btn.getAttribute('data-target');
                
                // Animasi filter pada kartu produk
                productItems.forEach(col => {
                    col.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (targetCategory === 'Semua' || col.getAttribute('data-category') === targetCategory) {
                            col.style.display = 'block';
                            setTimeout(() => col.style.opacity = '1', 50);
                        } else {
                            col.style.display = 'none';
                        }
                    }, 300);
                });
            });
        });
    }
});
