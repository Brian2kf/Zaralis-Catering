document.addEventListener("DOMContentLoaded", function() {
    // Determine the base path in case some files are in subdirectories
    const isSubdir = window.location.pathname.includes('/admin/');
    const basePath = isSubdir ? '../' : '';

    // Cek status login
    const isLoggedIn = localStorage.getItem('zaralis_user') !== null && !isSubdir;
    const navbarFile = isLoggedIn ? "components/navbar-auth.html" : "components/navbar.html";

    // Load Navbar
    const navbarPlaceholder = document.getElementById("navbar-placeholder");
    if (navbarPlaceholder) {
        fetch(basePath + navbarFile)
            .then(response => response.text())
            .then(data => {
                navbarPlaceholder.innerHTML = data;
                highlightActiveLink();
                
                // Isi data pengguna jika login
                if (isLoggedIn && typeof window.populateAuthNavbar === 'function') {
                    window.populateAuthNavbar();
                }
            })
            .catch(error => console.error('Error loading navbar:', error));
    }

    // Load Footer
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        fetch(basePath + "components/footer.html")
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

function highlightActiveLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll("#navbar-placeholder .nav-link-custom");
    
    // Remove active class from all
    navLinks.forEach(link => {
        link.classList.remove("active");
        
        // Add active class if it matches the current path
        const linkPath = link.getAttribute("href");
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add("active");
        }
    });
}

// Tambahkan utilitas populateAuthNavbar
window.populateAuthNavbar = function() {
    try {
        const userStr = localStorage.getItem('zaralis_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        
        const nameLabel = document.querySelector('.dropdown-item-name');
        if (nameLabel) {
            nameLabel.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        const avatarImg = document.querySelector('.user-avatar');
        if (avatarImg) {
            const encodedName = encodeURIComponent(`${user.firstName} ${user.lastName}`);
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodedName}&background=2D6A4F&color=fff`;
        }
    } catch(e) {
        console.error('Failed to populate auth navbar', e);
    }
}
