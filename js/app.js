// js/app.js - Global utilities & interactions

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
    window.location.href = 'index.html';
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar-custom');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow');
            } else {
                navbar.classList.remove('shadow');
            }
        });
    }

    // 2. Format Currency Utility (bisa dipanggil di file lain)
    window.formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };
});
