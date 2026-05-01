// ============================================================
// js/track-order.js
// Logic untuk halaman Cek Status Pesanan
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── Elemen UI ──────────────────────────────────────────
    const inputOrderNumber = document.getElementById('input-order-number');
    const inputIdentifier  = document.getElementById('input-identifier');
    const btnTrack         = document.getElementById('btn-track-order');
    const alertArea        = document.getElementById('track-alert-area');
    const resultSection    = document.getElementById('tracking-result-section');
    const btnLoading       = document.getElementById('btn-track-loading');
    const btnText          = document.getElementById('btn-track-text');

    // ── Event Listeners ──────────────────────────────────────
    btnTrack.addEventListener('click', handleTrack);

    [inputOrderNumber, inputIdentifier].forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleTrack();
        });
    });

    // ── Handler Utama ─────────────────────────────────────────
    async function handleTrack() {
        const orderNumber = inputOrderNumber.value.trim();
        const identifier  = inputIdentifier.value.trim();

        // Validasi client-side
        if (!orderNumber || !identifier) {
            showAlert('warning', 'info', 'Mohon isi nomor pesanan dan email/nomor HP terlebih dahulu.');
            return;
        }

        setLoading(true);
        clearAlert();
        hideResult();

        try {
            const url = `api/orders/track.php?order_number=${encodeURIComponent(orderNumber)}&identifier=${encodeURIComponent(identifier)}`;
            const res  = await fetch(url);
            const data = await res.json();

            if (!data.success) {
                handleError(res.status, data.message);
                return;
            }

            renderResult(data.order);
            showResult();

        } catch (err) {
            showAlert('danger', 'wifi_off', 'Gagal terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        } finally {
            setLoading(false);
        }
    }

    // ── Render Utama ─────────────────────────────────────────
    function renderResult(order) {
        renderSummary(order);
        renderTimeline(order.timeline, order.status);
        renderItems(order.items);
    }

    // ── Render: Summary Card ──────────────────────────────────
    function renderSummary(order) {
        // Order number
        document.getElementById('summary-order-number').textContent = order.order_number;

        // Status badge
        const badge = document.getElementById('summary-status-badge');
        badge.innerHTML = `
            <span class="material-symbols-outlined fs-6">${order.status_icon}</span>
            ${order.status_label}
        `;
        badge.className = `badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 status-badge-${order.status}`;

        // Tanggal & waktu pengiriman
        const deliveryDate = formatDate(order.delivery_date);
        const deliveryTime = order.delivery_time;
        document.getElementById('summary-delivery').textContent = `${deliveryDate}, ${deliveryTime} WIB`;

        // Total & alamat
        document.getElementById('summary-total').textContent = formatRupiah(order.total_amount);
        document.getElementById('summary-address').textContent = order.delivery_address;

        // Catatan pesanan
        const notesRow = document.getElementById('summary-notes-row');
        if (order.order_notes && order.order_notes.trim()) {
            document.getElementById('summary-notes').textContent = order.order_notes;
            notesRow.classList.remove('d-none');
        } else {
            notesRow.classList.add('d-none');
        }

        // Info pembayaran
        const paymentRow = document.getElementById('summary-payment-row');
        if (order.payment) {
            const payLabel = { uploaded: 'Diunggah, menunggu verifikasi', verified: 'Terverifikasi', rejected: 'Ditolak admin' };
            document.getElementById('summary-payment-status').textContent = payLabel[order.payment.status] || order.payment.status;
            paymentRow.classList.remove('d-none');
        } else {
            paymentRow.classList.add('d-none');
        }
    }

    // ── Render: Timeline ──────────────────────────────────────
    function renderTimeline(timeline, currentStatus) {
        const container   = document.getElementById('timeline-container');
        const progressBar = document.getElementById('timeline-progress');

        // Hitung progress percentage
        const activeIndex = timeline.findIndex(s => s.active);
        const doneCount   = timeline.filter(s => s.done).length;
        let progressPct   = 0;

        if (currentStatus === 'completed') {
            progressPct = 100;
        } else if (activeIndex > 0) {
            progressPct = Math.round((doneCount / (timeline.length - 1)) * 100);
        } else if (activeIndex === 0) {
            progressPct = 5;
        }

        progressBar.style.height = progressPct + '%';

        // Generate step HTML
        let stepsHtml = '';
        timeline.forEach((step) => {
            const iconClass  = step.done ? 'completed' : step.active ? 'active' : 'pending';
            const iconSymbol = step.done ? 'check' : step.icon;
            const opacity    = (!step.done && !step.active) ? 'opacity-50' : '';
            const timestamp  = step.timestamp ? `<p class="text-muted small mb-2">${formatDateTime(step.timestamp)}</p>` : '';

            if (step.active) {
                stepsHtml += `
                <div class="timeline-step ${opacity}">
                    <div class="timeline-icon ${iconClass}">
                        <span class="material-symbols-outlined fs-5">${iconSymbol}</span>
                    </div>
                    <div class="active-step-card p-3 position-relative overflow-hidden">
                        <span class="material-symbols-outlined icon-bg">${step.icon}</span>
                        <h4 class="h5 fw-bold mb-1 text-secondary-custom" style="font-family:'Outfit',sans-serif;position:relative;z-index:1;">${step.label}</h4>
                        ${timestamp ? timestamp.replace('class="text-muted', 'style="position:relative;z-index:1;" class="text-muted') : ''}
                    </div>
                </div>`;
            } else {
                stepsHtml += `
                <div class="timeline-step ${opacity}">
                    <div class="timeline-icon ${iconClass}">
                        <span class="material-symbols-outlined fs-5">${iconSymbol}</span>
                    </div>
                    <div class="pt-1">
                        <h4 class="h5 fw-bold mb-1 ${step.done ? 'text-dark' : 'text-muted'}" style="font-family:'Outfit',sans-serif;">${step.label}</h4>
                        ${timestamp}
                        ${step.done ? '<p class="text-success-emphasis small mb-0"><span class="material-symbols-outlined" style="font-size:0.9rem;vertical-align:middle;">check_circle</span> Selesai</p>' : ''}
                    </div>
                </div>`;
            }
        });

        // Jika status cancelled, tambahkan step cancelled di akhir
        if (currentStatus === 'cancelled') {
            stepsHtml += `
            <div class="timeline-step">
                <div class="timeline-icon" style="background-color:#dc3545;color:white;">
                    <span class="material-symbols-outlined fs-5">cancel</span>
                </div>
                <div class="active-step-card p-3" style="border-color:rgba(220,53,69,0.2);">
                    <h4 class="h5 fw-bold mb-1 text-danger" style="font-family:'Outfit',sans-serif;">Pesanan Dibatalkan</h4>
                    <p class="text-muted small mb-0">Pesanan ini telah dibatalkan. Hubungi kami untuk informasi lebih lanjut.</p>
                </div>
            </div>`;
        }

        container.innerHTML = stepsHtml;
    }

    // ── Render: Items ─────────────────────────────────────────
    function renderItems(items) {
        const itemsSection = document.getElementById('items-section');
        let html = '';

        // Paket Besar
        if (items.paket_besar && items.paket_besar.length > 0) {
            html += `<h5 class="fw-bold mb-3" style="font-family:'Outfit',sans-serif;">Paket Besar</h5>`;
            items.paket_besar.forEach(item => {
                html += `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <span class="fw-medium">${item.name}</span>
                        <span class="badge bg-light text-muted ms-2">×${item.quantity}</span>
                    </div>
                    <span class="fw-bold text-primary-custom">${formatRupiah(item.subtotal)}</span>
                </div>`;
            });
        }

        // Kue Satuan (Paket)
        if (items.kue_satuan && items.kue_satuan.length > 0) {
            if (html) html += '<div class="mt-4"></div>';
            html += `<h5 class="fw-bold mb-3" style="font-family:'Outfit',sans-serif;">Kue Satuan</h5>`;
            items.kue_satuan.forEach((pkg, i) => {
                const pkgTotal = pkg.price * pkg.quantity;
                html += `
                <div class="mb-3 p-3 bg-light rounded">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold">${pkg.name}</span>
                        <span class="fw-bold text-primary-custom">${formatRupiah(pkgTotal)}</span>
                    </div>
                    <p class="text-muted small mb-2">${pkg.quantity} paket × ${formatRupiah(pkg.price)}/paket</p>
                    <ul class="list-unstyled mb-0 ps-2">`;
                if (pkg.items && pkg.items.length > 0) {
                    pkg.items.forEach(pkgItem => {
                        html += `<li class="small text-secondary">
                            <span class="material-symbols-outlined" style="font-size:0.85rem;vertical-align:middle;">chevron_right</span>
                            ${pkgItem.name} ×${pkgItem.quantity}
                        </li>`;
                    });
                }
                html += `</ul></div>`;
            });
        }

        if (!html) {
            html = '<p class="text-muted small mb-0">Tidak ada item ditemukan.</p>';
        }

        itemsSection.innerHTML = html;
    }

    // ── Helpers UI ────────────────────────────────────────────
    function handleError(status, message) {
        if (status === 404) {
            showAlert('warning', 'search_off', message);
        } else if (status === 403) {
            showAlert('danger', 'lock', message);
        } else {
            showAlert('danger', 'error', message);
        }
    }

    function showAlert(type, icon, message) {
        // type: success | warning | danger | info
        const colorMap = {
            success : { bg: 'alert-success',  iconColor: 'text-success' },
            warning : { bg: 'alert-warning',  iconColor: 'text-warning' },
            danger  : { bg: 'alert-danger',   iconColor: 'text-danger'  },
            info    : { bg: 'alert-info',      iconColor: 'text-info'    },
        };
        const { bg, iconColor } = colorMap[type] || colorMap['info'];
        alertArea.innerHTML = `
            <div class="alert ${bg} d-flex align-items-center gap-2 mb-0 animate__fadeIn" role="alert">
                <span class="material-symbols-outlined ${iconColor}">${icon}</span>
                <span>${message}</span>
            </div>`;
        alertArea.classList.remove('d-none');
    }

    function clearAlert() {
        alertArea.classList.add('d-none');
        alertArea.innerHTML = '';
    }

    function setLoading(isLoading) {
        btnTrack.disabled = isLoading;
        btnLoading.classList.toggle('d-none', !isLoading);
        btnText.classList.toggle('d-none', isLoading);
    }

    function showResult() {
        resultSection.classList.remove('d-none');
        // Smooth scroll ke hasil
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        // Fade-in animation
        resultSection.style.opacity = '0';
        resultSection.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
            resultSection.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            resultSection.style.opacity = '1';
            resultSection.style.transform = 'translateY(0)';
        });
    }

    function hideResult() {
        resultSection.classList.add('d-none');
        resultSection.style.opacity = '';
        resultSection.style.transform = '';
        resultSection.style.transition = '';
    }

    // ── Format Helpers ────────────────────────────────────────
    function formatRupiah(amount) {
        return 'Rp ' + Number(amount).toLocaleString('id-ID');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatDateTime(datetimeStr) {
        if (!datetimeStr) return '-';
        const d = new Date(datetimeStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
});
