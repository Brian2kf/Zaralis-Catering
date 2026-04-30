// ============================================================
// js/load-components.js  (versi baru — berbasis session PHP)
// Menggantikan load-components.js yang lama
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {
    const isSubdir   = window.location.pathname.includes('/admin/');
    const basePath   = isSubdir ? '../' : '';
    const apiBase    = basePath + 'api/auth/';

    // -------------------------------------------------------
    // 1. Cek status login dari session PHP
    // -------------------------------------------------------
    let authStatus = { logged_in: false };
    try {
        const res    = await fetch(apiBase + 'status.php');
        authStatus   = await res.json();
    } catch (e) {
        console.warn('Gagal cek status login:', e);
    }

    const isLoggedIn = authStatus.logged_in;
    const navbarFile = isLoggedIn
        ? basePath + 'components/navbar-auth.html'
        : basePath + 'components/navbar.html';

    // -------------------------------------------------------
    // 2. Load Navbar
    // -------------------------------------------------------
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        try {
            const html = await fetch(navbarFile).then(r => r.text());
            navbarPlaceholder.innerHTML = html;
            highlightActiveLink();

            if (isLoggedIn) {
                populateAuthNavbar(authStatus);
            }
        } catch (e) {
            console.error('Gagal load navbar:', e);
        }
    }

    // -------------------------------------------------------
    // 3. Load Footer
    // -------------------------------------------------------
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        try {
            const html = await fetch(basePath + 'components/footer.html').then(r => r.text());
            footerPlaceholder.innerHTML = html;
        } catch (e) {
            console.error('Gagal load footer:', e);
        }
    }

    // -------------------------------------------------------
    // 4. Expose logout ke window (dipanggil dari navbar-auth.html)
    // -------------------------------------------------------
    window.logout = async function (e) {
        if (e) e.preventDefault();
        try {
            await fetch(apiBase + 'logout.php', { method: 'POST' });
        } catch (_) {}
        window.location.href = basePath + 'login.php';
    };
});

// -------------------------------------------------------
// Isi data user di navbar-auth
// -------------------------------------------------------
function populateAuthNavbar(authStatus) {
    const nameEl   = document.querySelector('.dropdown-item-name');
    const avatarEl = document.querySelector('.user-avatar');

    if (nameEl)   nameEl.textContent = authStatus.name  || '';
    if (avatarEl) avatarEl.src       = authStatus.avatar_url || '';
}

// -------------------------------------------------------
// Aktifkan link navbar sesuai halaman yang sedang dibuka
// -------------------------------------------------------
function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.php';
    document.querySelectorAll('#navbar-placeholder .nav-link-custom').forEach(link => {
        link.classList.remove('active');
        const href = (link.getAttribute('href') || '').split('/').pop();
        if (href === currentPage || (currentPage === '' && href === 'index.php')) {
            link.classList.add('active');
        }
    });
}
