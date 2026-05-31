document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector('.table-custom tbody');
    const paginationWrapper = document.querySelector('.pagination-wrapper');
    let allOrders = [];
    let currentFilter = 'Semua';
    let currentSubFilter = 'Semua';
    let currentPage = 1;
    const itemsPerPage = 5;

    // Elements
    const primaryBtns = document.querySelectorAll('.filter-btn');
    const secondaryContainer = document.querySelector('.flex-wrap.gap-2.ps-2'); // Sub-filter container
    const secondaryBtns = secondaryContainer ? secondaryContainer.querySelectorAll('.subfilter-btn') : [];

    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('id-ID', options);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending_payment': '<span class="status-badge waiting"><span class="dot"></span> Belum Bayar</span>',
            'pending_verification': '<span class="status-badge waiting"><span class="dot"></span> Menunggu Verifikasi</span>',
            'processing': '<span class="status-badge process"><span class="dot"></span> Diproses</span>',
            'shipped': '<span class="status-badge process"><span class="dot"></span> Dikirim</span>',
            'completed': '<span class="status-badge success"><span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Berhasil</span>',
            'cancelled': '<span class="status-badge danger"><span class="dot"></span> Dibatalkan</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    };

    async function loadOrders() {
        try {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary-custom" role="status"></div><p class="mt-2 text-muted">Memuat riwayat pesanan...</p></td></tr>';

            const response = await fetch('api/orders/list_by_user.php');
            const result = await response.json();

            if (result.success) {
                allOrders = result.orders;
                applyFilters();
            } else {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">${result.message || 'Gagal memuat data.'}</td></tr>`;
            }
        } catch (error) {
            console.error("Error:", error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-danger">Terjadi kesalahan pada server.</td></tr>';
        }
    }

    function applyFilters() {
        let filtered = allOrders;

        if (currentFilter === 'Berlangsung') {
            // Jika sub-filter Selesai, kita masukkan status 'completed' ke dalam filter Berlangsung
            const targetStatuses = ['pending_payment', 'pending_verification', 'processing', 'shipped'];
            if (currentSubFilter === 'Selesai') targetStatuses.push('completed');
            
            filtered = filtered.filter(o => targetStatuses.includes(o.status));
            
            if (currentSubFilter === 'Menunggu Verifikasi') {
                filtered = filtered.filter(o => ['pending_payment', 'pending_verification'].includes(o.status));
            } else if (currentSubFilter === 'Diproses') {
                filtered = filtered.filter(o => o.status === 'processing');
            } else if (currentSubFilter === 'Dikirim') {
                filtered = filtered.filter(o => o.status === 'shipped');
            } else if (currentSubFilter === 'Selesai') {
                filtered = filtered.filter(o => o.status === 'completed');
            }
        } else if (currentFilter === 'Berhasil') {
            filtered = filtered.filter(o => o.status === 'completed');
        } else if (currentFilter === 'Tidak Berhasil') {
            filtered = filtered.filter(o => o.status === 'cancelled');
        }

        currentPage = 1; // Reset ke halaman pertama setiap filter berubah
        renderOrders(filtered);
    }

    function renderOrders(orders) {
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">Belum ada transaksi.</td></tr>';
            if (paginationWrapper) paginationWrapper.classList.add('d-none');
            return;
        }

        if (paginationWrapper) paginationWrapper.classList.remove('d-none');
        
        // Pagination Logic
        const totalItems = orders.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedOrders = orders.slice(startIndex, endIndex);

        tableBody.innerHTML = '';
        paginatedOrders.forEach(order => {
            const tr = document.createElement('tr');
            const mainItem = order.item_reg || order.item_pkg || '-';
            const isCompleted = order.status === 'completed';

            // Tombol aksi: review (jika sudah selesai) + tombol detail
            const reviewBtn = isCompleted
                ? `<button class="action-btn btn-review-order text-nowrap" data-order-number="${order.order_number}" data-order-id="${order.id}" title="Review Produk" style="background:none;border:none;cursor:pointer;">
                       <span class="material-symbols-outlined" style="font-size:20px;color:#f59e0b;vertical-align:middle;" title="Beri Review">star</span>
                   </button>`
                : '';
            
            tr.innerHTML = `
                <td class="fw-bold text-primary-custom">${order.order_number}</td>
                <td class="text-muted">${formatDate(order.created_at)}</td>
                <td>${mainItem}</td>
                <td class="fw-bold text-secondary-custom" style="color: #E07A5F;">${formatRp(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td class="text-end d-flex gap-1 justify-content-end align-items-center">
                    ${reviewBtn}
                    <a href="detail-pembelian.php?order=${order.order_number}" class="action-btn" title="Lihat Detail">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </a>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Bind tombol review
        tableBody.querySelectorAll('.btn-review-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderNumber = btn.getAttribute('data-order-number');
                const orderId     = btn.getAttribute('data-order-id');
                openReviewModal(orderId, orderNumber);
            });
        });

        renderPagination(totalPages, startIndex + 1, endIndex, totalItems);
    }

    function renderPagination(totalPages, startRange, endRange, totalItems) {
        if (!paginationWrapper) return;

        const countSpan = paginationWrapper.querySelector('span');
        if (countSpan) countSpan.textContent = `Menampilkan ${startRange}-${endRange} dari ${totalItems} transaksi`;

        const btnContainer = paginationWrapper.querySelector('.d-flex.gap-1');
        if (!btnContainer) return;

        btnContainer.innerHTML = '';

        // Prev Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.disabled = currentPage === 1;
        prevBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>';
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilters(); // Re-apply current filters to use current data set
            }
        });
        btnContainer.appendChild(prevBtn);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                // Re-render without full filter re-run to maintain data set
                // But easier to just call applyFilters or a specific render function
                renderOrdersForCurrentPage();
            });
            btnContainer.appendChild(pageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>';
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderOrdersForCurrentPage();
            }
        });
        btnContainer.appendChild(nextBtn);
    }

    function renderOrdersForCurrentPage() {
        // Reuse applyFilters logic but don't reset currentPage
        let filtered = allOrders;
        if (currentFilter === 'Berlangsung') {
            const targetStatuses = ['pending_payment', 'pending_verification', 'processing', 'shipped'];
            if (currentSubFilter === 'Selesai') targetStatuses.push('completed');
            
            filtered = filtered.filter(o => targetStatuses.includes(o.status));
            
            if (currentSubFilter === 'Menunggu Verifikasi') {
                filtered = filtered.filter(o => ['pending_payment', 'pending_verification'].includes(o.status));
            } else if (currentSubFilter === 'Diproses') {
                filtered = filtered.filter(o => o.status === 'processing');
            } else if (currentSubFilter === 'Dikirim') {
                filtered = filtered.filter(o => o.status === 'shipped');
            } else if (currentSubFilter === 'Selesai') {
                filtered = filtered.filter(o => o.status === 'completed');
            }
        } else if (currentFilter === 'Berhasil') {
            filtered = filtered.filter(o => o.status === 'completed');
        } else if (currentFilter === 'Tidak Berhasil') {
            filtered = filtered.filter(o => o.status === 'cancelled');
        }
        renderOrders(filtered);
    }

    // Bind Filter Events
    const allFilterBtns = [...primaryBtns, ...secondaryBtns];

    allFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Hapus class active dari semua tombol
            allFilterBtns.forEach(b => {
                b.classList.remove('active');
                // Hapus ikon dari primary buttons jika ada
                const icon = b.querySelector('.material-symbols-outlined');
                if (icon && b.classList.contains('filter-btn')) icon.remove();
            });

            // Aktifkan tombol yang diklik
            btn.classList.add('active');
            
            const text = btn.textContent.replace('expand_more', '').trim();
            const isPrimary = [...primaryBtns].includes(btn);

            if (isPrimary) {
                currentFilter = text;
                currentSubFilter = 'Semua';

                if (currentFilter === 'Berlangsung') {
                    btn.innerHTML = 'Berlangsung <span class="material-symbols-outlined fs-6">expand_more</span>';
                    if (secondaryContainer) {
                        secondaryContainer.style.display = 'flex';
                        // Default sub-filter active is "Semua" or first? User said hide subfilters.
                        // We should probably deactivate all subfilters when switching primary.
                        secondaryBtns.forEach(sb => sb.classList.remove('active'));
                    }
                } else {
                    if (secondaryContainer) secondaryContainer.style.display = 'none';
                }
            } else {
                // Secondary button diklik
                currentFilter = 'Berlangsung'; // Parent-nya
                currentSubFilter = text;

                // Tetap tampilkan secondary container
                if (secondaryContainer) secondaryContainer.style.display = 'flex';

                // Pastikan parent 'Berlangsung' terlihat aktif secara visual jika diinginkan
                primaryBtns.forEach(pb => {
                    if (pb.textContent.includes('Berlangsung')) {
                        pb.classList.add('active');
                        if (!pb.querySelector('.material-symbols-outlined')) {
                            pb.innerHTML = 'Berlangsung <span class="material-symbols-outlined fs-6">expand_more</span>';
                        }
                    } else {
                        pb.classList.remove('active');
                    }
                });
            }

            applyFilters();
        });
    });

    // ============================================================
    // Review Modal Logic
    // ============================================================

    // Koleksi review yang akan di-submit / di-update
    let reviewDataMap = {}; // key: product_id, value: { rating, comment, reviewId (jika edit) }

    // Render bintang interaktif untuk input
    function renderStarInput(productId, currentRating = 0) {
        let html = `<div class="d-flex gap-1 star-input-group" data-product-id="${productId}">`;
        for (let i = 1; i <= 5; i++) {
            html += `<button type="button" class="btn p-0 star-input-btn${i <= currentRating ? ' active' : ''}"
                data-value="${i}" data-product-id="${productId}"
                style="background:none;border:none;font-size:1.8rem;color:${i <= currentRating ? '#f59e0b' : '#d1d5db'};cursor:pointer;line-height:1;">
                <span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${i <= currentRating ? 1 : 0};font-size:1.8rem;">star</span>
            </button>`;
        }
        html += `</div>`;
        return html;
    }

    // Render bintang display-only
    function renderStarDisplay(rating) {
        let html = '<div class="d-flex gap-1">';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${i <= rating ? 1 : 0};font-size:1.2rem;color:${i <= rating ? '#f59e0b' : '#d1d5db'};">star</span>`;
        }
        html += '</div>';
        return html;
    }

    async function openReviewModal(orderId, orderNumber) {
        const modal       = new bootstrap.Modal(document.getElementById('reviewModal'));
        const modalBody   = document.getElementById('review-modal-body');
        const modalFooter = document.getElementById('review-modal-footer');
        const submitBtn   = document.getElementById('btn-submit-reviews');
        const orderNumEl  = document.getElementById('review-modal-order-num');

        // Reset state
        reviewDataMap = {};
        if (orderNumEl) orderNumEl.textContent = `Pesanan: ${orderNumber}`;
        if (modalBody) modalBody.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary-custom" role="status"></div><p class="mt-2 text-muted small">Memuat produk...</p></div>';
        if (submitBtn) submitBtn.style.display = 'none';
        modal.show();

        try {
            // 1. Fetch detail order untuk mendapatkan daftar produk
            const orderRes  = await fetch(`api/orders/show.php?order=${orderNumber}`);
            const orderData = await orderRes.json();
            if (orderData.status !== 'success') throw new Error('Gagal mengambil data order');

            const order = orderData.data;

            // Kumpulkan semua produk yang dapat direview
            // a) Produk paket besar (order_items)
            const reviewableProducts = [];
            if (order.regular_items) {
                order.regular_items.forEach(item => {
                    if (item.product_id) {
                        reviewableProducts.push({
                            product_id:   item.product_id,
                            product_name: item.product_name_snapshot,
                            type:         'paket_besar'
                        });
                    }
                });
            }
            // b) Produk kue satuan di dalam paket (order_package_items)
            if (order.packages) {
                order.packages.forEach(pkg => {
                    if (pkg.items) {
                        pkg.items.forEach(item => {
                            if (item.product_id) {
                                // Hindari duplikat produk yang sama di order yang sama
                                const exists = reviewableProducts.find(p => p.product_id === item.product_id);
                                if (!exists) {
                                    reviewableProducts.push({
                                        product_id:   item.product_id,
                                        product_name: item.product_name_snapshot,
                                        type:         'kue_satuan'
                                    });
                                }
                            }
                        });
                    }
                });
            }

            if (reviewableProducts.length === 0) {
                if (modalBody) modalBody.innerHTML = '<p class="text-center text-muted py-3">Tidak ada produk yang dapat direview pada pesanan ini.</p>';
                return;
            }

            // 2. Fetch status review untuk setiap produk
            const reviewChecks = await Promise.all(
                reviewableProducts.map(p =>
                    fetch(`api/products/reviews.php?product_id=${p.product_id}&order_id=${orderId}`)
                        .then(r => r.json())
                        .then(d => ({ ...p, review: d.review, has_review: d.has_review }))
                )
            );

            // 3. Cek apakah order bisa masih di-edit (updated_at tidak lebih dari 7 hari)
            // Kita hitung dari sisi JS juga untuk menentukan apakah tombol edit muncul
            // (validasi ketat tetap ada di server)
            const orderUpdated = new Date(order.updated_at || order.created_at);
            const now          = new Date();
            const diffDays     = (now - orderUpdated) / (1000 * 60 * 60 * 24);
            const canEdit      = diffDays <= 7;

            // 4. Cek apakah semua produk sudah direview
            const allReviewed = reviewChecks.every(p => p.has_review);

            // 5. Render modal body
            let bodyHtml = '';
            let hasUnreviewed = false;

            reviewChecks.forEach((p, idx) => {
                const isLast = idx === reviewChecks.length - 1;
                bodyHtml += `<div class="${isLast ? '' : 'mb-4 pb-4 border-bottom'}">`;
                bodyHtml += `
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <span class="badge ${p.type === 'kue_satuan' ? 'text-bg-warning' : 'text-bg-success'} fw-normal" style="font-size:0.7rem;">
                            ${p.type === 'kue_satuan' ? 'Kue Satuan' : 'Paket Besar'}
                        </span>
                        <span class="fw-semibold text-dark">${p.product_name}</span>
                    </div>`;

                if (p.has_review) {
                    // Sudah ada review — tampilkan view mode
                    bodyHtml += `
                        <div class="p-3 rounded-3 bg-light mb-2">
                            <div class="mb-2">${renderStarDisplay(p.review.rating)}</div>
                            ${p.review.comment ? `<p class="text-muted small fst-italic mb-0">"${escapeHtml(p.review.comment)}"</p>` : '<p class="text-muted small mb-0">Tidak ada komentar.</p>'}
                        </div>`;
                    if (canEdit) {
                        bodyHtml += `
                        <button class="btn btn-sm btn-outline-secondary btn-edit-review mt-1" 
                            data-product-id="${p.product_id}" data-review-id="${p.review.id}"
                            data-rating="${p.review.rating}" data-comment="${escapeHtml(p.review.comment || '')}">
                            <span class="material-symbols-outlined align-middle" style="font-size:15px;">edit</span>
                            Edit Review
                        </button>`;
                    }
                    bodyHtml += `<div class="review-edit-form mt-2 d-none" data-product-id="${p.product_id}"></div>`;
                } else {
                    // Belum ada review — tampilkan form
                    hasUnreviewed = true;
                    bodyHtml += `
                        <div class="review-form" data-product-id="${p.product_id}">
                            <div class="mb-2">
                                <label class="form-label small fw-medium text-dark">Penilaian Anda:</label>
                                ${renderStarInput(p.product_id)}
                                <div class="small text-danger mt-1 d-none star-error-${p.product_id}">Silakan pilih rating bintang.</div>
                            </div>
                            <div>
                                <label class="form-label small fw-medium text-dark">Komentar (opsional):</label>
                                <textarea class="form-control review-comment-input" rows="2" placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                                    data-product-id="${p.product_id}" style="resize:none;"></textarea>
                            </div>
                        </div>`;
                }
                bodyHtml += `</div>`;
            });

            if (modalBody) modalBody.innerHTML = bodyHtml;

            // 6. Bind star input events
            modalBody.querySelectorAll('.star-input-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const val       = parseInt(btn.getAttribute('data-value'));
                    const productId = btn.getAttribute('data-product-id');
                    const group     = modalBody.querySelector(`.star-input-group[data-product-id="${productId}"]`);
                    if (!group) return;

                    // Update tampilan bintang
                    group.querySelectorAll('.star-input-btn').forEach((b, i) => {
                        const active = i < val;
                        b.style.color = active ? '#f59e0b' : '#d1d5db';
                        b.querySelector('span').style.fontVariationSettings = `'FILL' ${active ? 1 : 0}`;
                        b.classList.toggle('active', active);
                    });

                    // Simpan ke reviewDataMap
                    if (!reviewDataMap[productId]) reviewDataMap[productId] = {};
                    reviewDataMap[productId].rating = val;

                    // Sembunyikan error
                    modalBody.querySelector(`.star-error-${productId}`)?.classList.add('d-none');
                });
            });

            // Simpan comment saat diketik
            modalBody.querySelectorAll('.review-comment-input').forEach(ta => {
                ta.addEventListener('input', () => {
                    const pid = ta.getAttribute('data-product-id');
                    if (!reviewDataMap[pid]) reviewDataMap[pid] = {};
                    reviewDataMap[pid].comment = ta.value;
                });
            });

            // 7. Bind tombol edit review
            modalBody.querySelectorAll('.btn-edit-review').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pid      = btn.getAttribute('data-product-id');
                    const rid      = btn.getAttribute('data-review-id');
                    const rating   = parseInt(btn.getAttribute('data-rating'));
                    const comment  = btn.getAttribute('data-comment');
                    const editForm = modalBody.querySelector(`.review-edit-form[data-product-id="${pid}"]`);
                    if (!editForm) return;

                    editForm.classList.remove('d-none');
                    editForm.innerHTML = `
                        <div class="mb-2">
                            <label class="form-label small fw-medium text-dark">Ubah Penilaian:</label>
                            ${renderStarInput(pid, rating)}
                        </div>
                        <div class="mb-2">
                            <label class="form-label small fw-medium text-dark">Ubah Komentar:</label>
                            <textarea class="form-control review-edit-comment" rows="2" data-product-id="${pid}" style="resize:none;">${comment}</textarea>
                        </div>`;

                    // Simpan data edit
                    reviewDataMap[pid] = { rating, comment, reviewId: rid, isEdit: true };

                    // Bind stars di form edit
                    editForm.querySelectorAll('.star-input-btn').forEach(sb => {
                        sb.addEventListener('click', () => {
                            const val = parseInt(sb.getAttribute('data-value'));
                            const grp = editForm.querySelector(`.star-input-group`);
                            if (!grp) return;
                            grp.querySelectorAll('.star-input-btn').forEach((b, i) => {
                                const a = i < val;
                                b.style.color = a ? '#f59e0b' : '#d1d5db';
                                b.querySelector('span').style.fontVariationSettings = `'FILL' ${a ? 1 : 0}`;
                                b.classList.toggle('active', a);
                            });
                            reviewDataMap[pid].rating = val;
                        });
                    });
                    editForm.querySelector('.review-edit-comment')?.addEventListener('input', e => {
                        reviewDataMap[pid].comment = e.target.value;
                    });

                    btn.style.display = 'none';
                    // Ambil tombol dari DOM aktual (bukan referensi lama yang sudah di-clone)
                    const liveSubmitBtn = document.getElementById('btn-submit-reviews');
                    if (liveSubmitBtn) liveSubmitBtn.style.display = '';
                });
            });

            // 8. Tampilkan tombol Kirim jika ada yang belum direview
            if (hasUnreviewed && submitBtn) submitBtn.style.display = '';
            if (allReviewed && !canEdit && submitBtn) submitBtn.style.display = 'none';

            // 9. Bind submit button
            if (submitBtn) {
                // Remove previous listeners
                const newSubmitBtn = submitBtn.cloneNode(true);
                submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
                newSubmitBtn.addEventListener('click', () => submitReviews(orderId, reviewChecks, newSubmitBtn));
            }

        } catch (err) {
            console.error('Error membuka modal review:', err);
            if (modalBody) modalBody.innerHTML = '<p class="text-center text-danger py-3">Gagal memuat data review. Silakan coba lagi.</p>';
        }
    }

    async function submitReviews(orderId, reviewChecks, submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Mengirim...';

        const modalBody = document.getElementById('review-modal-body');
        let hasError    = false;
        let successCount = 0;

        for (const p of reviewChecks) {
            const pid  = String(p.product_id);
            const data = reviewDataMap[pid];
            if (!data) continue; // produk ini tidak diubah

            // Validasi rating
            if (!data.rating || data.rating < 1) {
                modalBody?.querySelector(`.star-error-${pid}`)?.classList.remove('d-none');
                hasError = true;
                continue;
            }

            try {
                let res;
                if (data.isEdit) {
                    // PUT — update review
                    res = await fetch('api/products/reviews.php', {
                        method:  'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ review_id: parseInt(data.reviewId), rating: data.rating, comment: data.comment || '' })
                    });
                } else {
                    // POST — review baru
                    res = await fetch('api/products/reviews.php', {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ product_id: p.product_id, order_id: parseInt(orderId), rating: data.rating, comment: data.comment || '' })
                    });
                }
                const result = await res.json();
                if (result.success) {
                    successCount++;
                } else {
                    alert(`Review untuk "${p.product_name}" gagal: ${result.message}`);
                    hasError = true;
                }
            } catch (e) {
                alert(`Terjadi kesalahan saat mengirim review untuk "${p.product_name}".`);
                hasError = true;
            }
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined align-middle me-1" style="font-size:18px;">send</span>Kirim Review';

        if (successCount > 0 && !hasError) {
            // Tutup modal dan refresh
            const modalEl = document.getElementById('reviewModal');
            const modal   = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            alert(`${successCount} review berhasil dikirim. Terima kasih atas ulasan Anda!`);
            loadOrders(); // refresh daftar order
        }
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text || '';
        return d.innerHTML;
    }

    loadOrders();
});
