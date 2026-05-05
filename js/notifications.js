// ============================================================
// js/notifications.js
// Logika untuk fetch dan render notifikasi di navbar
// ============================================================

function initNotifications() {
    const bellBtn = document.getElementById('notificationDropdownBtn');
    if (!bellBtn) return; // Belum dimuat atau tidak login

    // Deteksi basePath (jika di folder admin, butuh ../)
    const isSubdir = window.location.pathname.includes('/admin/');
    const basePath = isSubdir ? '../' : '';

    const notificationDot = document.getElementById('notificationDotIndicator');
    const notificationList = document.getElementById('notificationList');

    async function fetchNotifications() {
        try {
            const response = await fetch(basePath + 'api/notifications/list.php');
            if (!response.ok) {
                if (response.status === 401) {
                    notificationList.innerHTML = '<li class="p-4 text-center text-muted small">Silakan login untuk melihat notifikasi.</li>';
                }
                return;
            }
            const result = await response.json();

            if (result.success) {
                updateBadge(result.unread_count);
                renderNotifications(result.notifications);
            } else {
                notificationList.innerHTML = '<li class="p-4 text-center text-muted small">Gagal memuat notifikasi.</li>';
            }
        } catch (e) {
            console.error("Gagal load notifikasi:", e);
            notificationList.innerHTML = '<li class="p-4 text-center text-danger small">Terjadi kesalahan sistem.</li>';
        }
    }

    function updateBadge(count) {
        if (notificationDot) {
            if (count > 0) {
                notificationDot.classList.remove('d-none');
            } else {
                notificationDot.classList.add('d-none');
            }
        }
    }

    function renderNotifications(notifications) {
        if (!notificationList) return;
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<li class="p-4 text-center text-muted small">Tidak ada notifikasi.</li>';
            return;
        }

        notificationList.innerHTML = notifications.map(n => `
            <li class="p-3 border-bottom notification-item ${n.is_read == 0 ? 'bg-light' : ''}">
                <div class="d-flex gap-2">
                    <div class="flex-grow-1">
                        <p class="mb-0 fw-bold small text-dark">${n.title}</p>
                        <p class="mb-1 text-muted" style="font-size: 0.75rem;">${n.message}</p>
                        <span class="text-muted" style="font-size: 0.7rem;">${timeAgo(n.created_at)}</span>
                    </div>
                    ${n.is_read == 0 ? '<div class="unread-indicator bg-primary-custom rounded-circle" style="width: 8px; height: 8px; margin-top: 5px;"></div>' : ''}
                </div>
            </li>
        `).join('');
    }

    function timeAgo(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " menit lalu";
        return "baru saja";
    }

    // Jalankan fetch pertama kali
    fetchNotifications();
    
    // Event listener untuk menghilangkan titik merah saat dropdown dibuka
    bellBtn.addEventListener('show.bs.dropdown', async () => {
        if (notificationDot && !notificationDot.classList.contains('d-none')) {
            // Sembunyikan titik merah di UI segera agar responsif
            notificationDot.classList.add('d-none');
            
            // Kirim request ke server untuk mark as read
            try {
                await fetch(basePath + 'api/notifications/mark_as_read.php', { method: 'POST' });
            } catch (e) {
                console.warn("Gagal mark as read:", e);
            }
        }
    });

    // Polling setiap 30 detik
    if (window.notifInterval) clearInterval(window.notifInterval);
    window.notifInterval = setInterval(fetchNotifications, 30000);
}

// Auto-init jika navbar sudah ada (fallback)
if (document.getElementById('notificationDropdownBtn')) {
    initNotifications();
}
