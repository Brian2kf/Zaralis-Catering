/**
 * js/admin/dashboard.js
 * Logika khusus untuk halaman Dashboard Admin
 */

document.addEventListener("DOMContentLoaded", () => {
    const dashboardStatsApi = '../api/admin/dashboard/stats.php';
    
    // Elements
    const dashboardDateEl = document.getElementById('dashboard-date');
    const newOrdersCountEl = document.getElementById('new-orders-count');
    const pendingVerificationCountEl = document.getElementById('pending-verification-count');
    const activeMenuCountEl = document.getElementById('active-menu-count');
    const recentOrdersListEl = document.getElementById('recent-orders-list');
    
    let salesChart = null;

    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const updateDate = () => {
        if (!dashboardDateEl) return;
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        dashboardDateEl.textContent = today.toLocaleDateString('id-ID', options);
    };

    const getStatusBadge = (status) => {
        const badges = {
            'pending_payment': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(108, 117, 125, 0.1); color: #6c757d; font-size: 0.7rem;">Belum Bayar</span>',
            'pending_verification': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(224, 122, 95, 0.1); color: #E07A5F; font-size: 0.7rem;">Verifikasi</span>',
            'processing': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(0, 123, 255, 0.1); color: #007bff; font-size: 0.7rem;">Diproses</span>',
            'shipped': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(113, 54, 56, 0.1); color: #713638; font-size: 0.7rem;">Dikirim</span>',
            'completed': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(45, 106, 79, 0.1); color: #2D6A4F; font-size: 0.7rem;">Selesai</span>',
            'cancelled': '<span class="badge rounded-pill fw-semibold" style="background-color: rgba(220, 53, 69, 0.1); color: #dc3545; font-size: 0.7rem;">Batal</span>'
        };
        return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
    };

    const renderRecentOrders = (orders) => {
        if (!recentOrdersListEl) return;
        
        if (orders.length === 0) {
            recentOrdersListEl.innerHTML = '<tr><td colspan="2" class="py-4 text-center text-muted">Belum ada pesanan.</td></tr>';
            return;
        }

        recentOrdersListEl.innerHTML = orders.map((order, index) => `
            <tr class="${index < orders.length - 1 ? 'border-bottom' : ''}">
                <td class="py-3 px-0">
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark" style="font-size: 0.875rem;">#${order.order_number}</span>
                        <span class="text-muted text-truncate" style="font-size: 0.8rem; max-width: 120px;">${order.customer_name}</span>
                    </div>
                </td>
                <td class="py-3 px-0 text-end">
                    <div class="d-flex flex-column align-items-end gap-1">
                        ${getStatusBadge(order.status)}
                        <span class="fw-medium text-dark" style="font-size: 0.875rem;">${formatRp(order.total_amount)}</span>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    const renderChart = (chartData) => {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        if (salesChart) {
            salesChart.destroy();
        }

        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Penjualan',
                    data: chartData.values,
                    fill: true,
                    backgroundColor: 'rgba(45, 106, 79, 0.1)',
                    borderColor: '#2D6A4F',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2D6A4F',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return ' ' + formatRp(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) return (value / 1000000) + 'jt';
                                if (value >= 1000) return (value / 1000) + 'k';
                                return value;
                            },
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    };

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(dashboardStatsApi);
            const result = await response.json();

            if (result.success) {
                const { overview, chart, recent_orders } = result.data;

                // Update Stats
                if (newOrdersCountEl) newOrdersCountEl.textContent = overview.new_orders;
                if (pendingVerificationCountEl) pendingVerificationCountEl.textContent = overview.pending_verification;
                if (activeMenuCountEl) activeMenuCountEl.textContent = overview.active_menu;

                // Render components
                renderChart(chart);
                renderRecentOrders(recent_orders);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    // Initialize
    updateDate();
    fetchDashboardData();

    // Auto refresh every 5 minutes
    setInterval(fetchDashboardData, 5 * 60 * 1000);
});
