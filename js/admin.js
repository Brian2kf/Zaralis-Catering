// js/admin.js - Logika interaksi khusus untuk dashboard Admin

document.addEventListener("DOMContentLoaded", () => {
    const isAdminPage = window.location.pathname.includes('/admin/');
    const basePath = isAdminPage ? '../' : '';
    const sidebarPlaceholder = document.getElementById('admin-sidebar-placeholder');

    const initAdminSidebar = () => {
        const sidebarToggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.admin-sidebar');

        if (sidebarToggleBtn && sidebar) {
            sidebarToggleBtn.addEventListener('click', () => {
                if (sidebar.classList.contains('d-none')) {
                    sidebar.classList.remove('d-none');
                    sidebar.classList.add('d-flex');

                    setTimeout(() => {
                        sidebar.classList.add('show');

                        let closeBtn = sidebar.querySelector('.mobile-close-btn');
                        if (!closeBtn) {
                            closeBtn = document.createElement('button');
                            closeBtn.className = 'btn btn-link text-dark d-md-none mobile-close-btn position-absolute';
                            closeBtn.style.top = '15px';
                            closeBtn.style.right = '10px';
                            closeBtn.innerHTML = '<span class="material-symbols-outlined fs-2">close</span>';

                            closeBtn.addEventListener('click', () => {
                                sidebar.classList.remove('show');
                                setTimeout(() => {
                                    sidebar.classList.remove('d-flex');
                                    sidebar.classList.add('d-none');
                                }, 300);
                            });

                            const sidebarHeader = sidebar.querySelector('.sidebar-header');
                            if (sidebarHeader) {
                                sidebarHeader.style.position = 'relative';
                                sidebarHeader.appendChild(closeBtn);
                            }
                        }
                    }, 10);
                } else {
                    sidebar.classList.remove('show');
                    setTimeout(() => {
                        sidebar.classList.remove('d-flex');
                        sidebar.classList.add('d-none');
                    }, 300);
                }
            });
        }

        const currentLocation = location.pathname.split('/').slice(-1)[0] || 'index.html';
        const menuItems = document.querySelectorAll('.nav-item-admin');

        menuItems.forEach(item => {
            item.classList.remove('active');
            const itemHref = item.getAttribute('href');
            if (itemHref === currentLocation || (currentLocation === '' && itemHref === 'index.html')) {
                item.classList.add('active');
            }
        });

        initBusinessSettings();
    };

    const initBusinessSettings = () => {
        const currentLocation = window.location.pathname.split('/').pop();
        if (currentLocation !== 'settings.html') return;

        const storageKey = 'zaralis_business_settings';
        const form = document.getElementById('businessSettingsForm');
        const businessName = document.getElementById('businessName');
        const businessPhone = document.getElementById('businessPhone');
        const businessAddress = document.getElementById('businessAddress');
        const businessBank = document.getElementById('businessBank');
        const businessBankAccount = document.getElementById('businessBankAccount');
        const businessAccountHolder = document.getElementById('businessAccountHolder');
        const messageBox = document.getElementById('businessSettingsMessage');
        const btnReset = document.getElementById('btnResetBusinessSettings');

        const loadSettings = () => {
            const settings = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (businessName) businessName.value = settings.name || '';
            if (businessPhone) businessPhone.value = settings.phone || '';
            if (businessAddress) businessAddress.value = settings.address || '';
            if (businessBank) businessBank.value = settings.bank || '';
            if (businessBankAccount) businessBankAccount.value = settings.bankAccount || '';
            if (businessAccountHolder) businessAccountHolder.value = settings.accountHolder || '';
        };

        const showMessage = (text) => {
            if (!messageBox) return;
            messageBox.textContent = text;
            messageBox.classList.remove('d-none');
            setTimeout(() => messageBox.classList.add('d-none'), 3500);
        };

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const settings = {
                    name: businessName?.value.trim() || '',
                    phone: businessPhone?.value.trim() || '',
                    address: businessAddress?.value.trim() || '',
                    bank: businessBank?.value.trim() || '',
                    bankAccount: businessBankAccount?.value.trim() || '',
                    accountHolder: businessAccountHolder?.value.trim() || ''
                };
                localStorage.setItem(storageKey, JSON.stringify(settings));
                showMessage('Pengaturan usaha berhasil disimpan.');
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                localStorage.removeItem(storageKey);
                loadSettings();
                showMessage('Pengaturan usaha telah direset.');
            });
        }

        loadSettings();
    };

    if (sidebarPlaceholder) {
        fetch(basePath + 'components/admin-sidebar.html')
            .then(response => response.text())
            .then(html => {
                sidebarPlaceholder.innerHTML = html;
                initAdminSidebar();
            })
            .catch(error => console.error('Error loading admin sidebar:', error));
    } else {
        initAdminSidebar();
    }
});
