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

        const currentLocation = location.pathname.split('/').slice(-1)[0] || 'index.php';
        const menuItems = document.querySelectorAll('.nav-item-admin');

        menuItems.forEach(item => {
            item.classList.remove('active');
            const itemHref = item.getAttribute('href');
            // Normalisasi: bandingkan dengan atau tanpa ekstensi .php/.php
            const currentBase = currentLocation.replace(/\.(php|html)$/, '');
            const hrefBase = (itemHref || '').replace(/\.(php|html)$/, '');
            if (itemHref === currentLocation || hrefBase === currentBase || (currentLocation === '' && hrefBase === 'index')) {
                item.classList.add('active');
            }
        });

        initBusinessSettings();
    };

    const initBusinessSettings = () => {
        const currentLocation = window.location.pathname.split('/').pop();
        if (currentLocation !== 'settings.php') return;

        const form = document.getElementById('businessSettingsForm');
        const businessName = document.getElementById('businessName');
        const businessPhone = document.getElementById('businessPhone');
        const businessAddress = document.getElementById('businessAddress');
        const businessBank = document.getElementById('businessBank');
        const businessBankAccount = document.getElementById('businessBankAccount');
        const businessAccountHolder = document.getElementById('businessAccountHolder');
        const messageBox = document.getElementById('businessSettingsMessage');
        const btnReset = document.getElementById('btnResetBusinessSettings');

        const loadSettings = async () => {
            try {
                const response = await fetch('../api/admin/settings/index.php');
                const result = await response.json();
                if (result.success && result.data) {
                    if (businessName) businessName.value = result.data.business_name || '';
                    if (businessPhone) businessPhone.value = result.data.business_phone || '';
                    if (businessAddress) businessAddress.value = result.data.business_address || '';
                    if (businessBank) businessBank.value = result.data.bank_name || '';
                    if (businessBankAccount) businessBankAccount.value = result.data.bank_account || '';
                    if (businessAccountHolder) businessAccountHolder.value = result.data.bank_holder || '';
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        const showMessage = (text, isError = false) => {
            if (!messageBox) return;
            messageBox.textContent = text;
            messageBox.className = `alert mt-4 ${isError ? 'alert-danger' : 'alert-success'}`;
            messageBox.classList.remove('d-none');
            setTimeout(() => messageBox.classList.add('d-none'), 3500);
        };

        if (form) {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const btnSubmit = form.querySelector('button[type="submit"]');
                const originalBtnText = btnSubmit.innerHTML;
                btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
                btnSubmit.disabled = true;

                const payload = {
                    business_name: businessName?.value.trim() || '',
                    business_phone: businessPhone?.value.trim() || '',
                    business_address: businessAddress?.value.trim() || '',
                    bank_name: businessBank?.value.trim() || '',
                    bank_account: businessBankAccount?.value.trim() || '',
                    bank_holder: businessAccountHolder?.value.trim() || ''
                };

                try {
                    const response = await fetch('../api/admin/settings/update.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message || 'Pengaturan usaha berhasil disimpan.');
                    } else {
                        showMessage(result.message || 'Gagal menyimpan pengaturan.', true);
                    }
                } catch (error) {
                    console.error('Error saving settings:', error);
                    showMessage('Terjadi kesalahan saat menyimpan pengaturan.', true);
                } finally {
                    btnSubmit.innerHTML = originalBtnText;
                    btnSubmit.disabled = false;
                }
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                loadSettings();
                showMessage('Form dikembalikan ke pengaturan terakhir yang tersimpan.');
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
