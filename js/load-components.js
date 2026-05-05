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
                // Sync data user ke localStorage untuk diakses getCurrentUser()
                localStorage.setItem('zaralis_user', JSON.stringify(authStatus));
                
                populateAuthNavbar(authStatus);
                // Load notifications logic
                const script = document.createElement('script');
                script.src = basePath + 'js/notifications.js';
                script.onload = () => {
                    if (typeof initNotifications === 'function') {
                        initNotifications();
                    }
                };
                document.body.appendChild(script);
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
            initFooterData(basePath);
        } catch (e) {
            console.error('Gagal load footer:', e);
        }
    }

    // -------------------------------------------------------
    // 3.5 Load Live Chat Widget (hanya untuk area non-admin)
    // -------------------------------------------------------
    if (!isSubdir) {
        try {
            const chatHtml = await fetch(basePath + 'components/chat-widget.html').then(r => r.text());
            const chatContainer = document.createElement('div');
            chatContainer.innerHTML = chatHtml;
            document.body.appendChild(chatContainer);
            
            // Add chat.css
            const chatCss = document.createElement('link');
            chatCss.rel = 'stylesheet';
            chatCss.href = basePath + 'css/chat.css';
            document.head.appendChild(chatCss);
            
            // Add chat.js
            const chatJs = document.createElement('script');
            chatJs.src = basePath + 'js/chat.js';
            document.body.appendChild(chatJs);
        } catch (e) {
            console.error('Gagal load live chat widget:', e);
        }
    }

    // -------------------------------------------------------
    // 4. Expose logout ke window (dipanggil dari navbar-auth.html)
    // -------------------------------------------------------
    window.logout = async function (e) {
        if (e) e.preventDefault();
        localStorage.removeItem('zaralis_user');
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
    const nameEl = document.querySelector('.dropdown-item-name');
    const avatarEl = document.querySelector('.user-avatar');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (nameEl) nameEl.textContent = authStatus.name || '';
    if (avatarEl) avatarEl.src = authStatus.avatar_url || '';

    // Jika admin, tambahkan link ke Admin Panel di dropdown
    if (authStatus.role === 'admin' && dropdownMenu) {
        const isSubdir = window.location.pathname.includes('/admin/');
        const adminUrl = isSubdir ? 'index.php' : 'admin/index.php';

        // Cek apakah link admin sudah ada agar tidak duplikat
        if (!dropdownMenu.querySelector('.admin-link')) {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = `<a class="dropdown-item fw-bold text-primary-custom admin-link" href="${adminUrl}">
                <span class="material-symbols-outlined fs-6 align-middle">dashboard</span> Admin Panel
            </a>`;
            const divider = dropdownMenu.querySelector('.dropdown-divider');
            if (divider) {
                dropdownMenu.insertBefore(adminLi, divider.nextSibling);
            }
        }
    }
}

// -------------------------------------------------------
// Aktifkan link navbar sesuai halaman yang sedang dibuka
// -------------------------------------------------------
function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.php';
    const currentBase = currentPage.replace(/\.(php|html)$/, '');

    document.querySelectorAll('#navbar-placeholder .nav-link-custom').forEach(link => {
        link.classList.remove('active');
        const href = (link.getAttribute('href') || '').split('/').pop();
        const hrefBase = href.replace(/\.(php|html)$/, '');

        if (href === currentPage || hrefBase === currentBase || (currentBase === 'index' && hrefBase === '')) {
            link.classList.add('active');
        }
    });
}

// -------------------------------------------------------
// Ambil data bisnis untuk Footer
// -------------------------------------------------------
async function initFooterData(basePath) {
    try {
        const res = await fetch(basePath + 'api/settings/show.php');
        const result = await res.json();
        
        if (result.success && result.data) {
            const data = result.data;
            const nameEl = document.getElementById('footerBusinessName');
            const addrEl = document.getElementById('footerBusinessAddress');
            const phoneEl = document.getElementById('footerBusinessPhone');
            
            if (nameEl) nameEl.textContent = data.business_name || "Zarali's Catering";
            if (addrEl) addrEl.textContent = data.business_address || "-";
            if (phoneEl) phoneEl.textContent = data.business_phone || "-";
        }
    } catch (e) {
        console.error('Gagal memuat data footer:', e);
    }
}
