document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');

    if (!orderNumber) {
        alert("Nomor pesanan tidak ditemukan.");
        window.location.href = 'index.html';
        return;
    }

    fetchOrderDetails(orderNumber);
});

async function fetchOrderDetails(orderNumber) {
    try {
        const response = await fetch(`api/orders/show.php?order=${orderNumber}`);
        const data = await response.json();

        if (response.ok) {
            renderOrderDetails(data);
        } else {
            alert(data.message || "Pesanan tidak ditemukan.");
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
}

function formatRp(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function renderOrderDetails(order) {
    const orderNumberBadge = document.getElementById('orderNumberBadge');
    if (orderNumberBadge) orderNumberBadge.innerText = `Order No: ${order.order_number}`;

    const orderNumberInput = document.getElementById('orderNumberInput');
    if (orderNumberInput) orderNumberInput.value = order.order_number;

    const itemsContainer = document.getElementById('orderItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';

        // 1. Render Paket Satuan (order_packages)
        if (order.packages && order.packages.length > 0) {
            order.packages.forEach(pkg => {
                const html = `
                    <div class="receipt-item">
                        <div>
                            <p class="receipt-item-title">${pkg.package_name}</p>
                            <p class="receipt-item-desc">${pkg.quantity} Paket</p>
                        </div>
                        <span class="receipt-item-price">${formatRp(pkg.package_price * pkg.quantity)}</span>
                    </div>
                `;
                itemsContainer.insertAdjacentHTML('beforeend', html);
            });
        }

        // 2. Render Paket Besar (regular_items / order_items)
        if (order.regular_items && order.regular_items.length > 0) {
            order.regular_items.forEach(item => {
                const html = `
                    <div class="receipt-item">
                        <div>
                            <p class="receipt-item-title">${item.product_name_snapshot}</p>
                            <p class="receipt-item-desc">${item.quantity} Unit</p>
                        </div>
                        <span class="receipt-item-price">${formatRp(item.subtotal)}</span>
                    </div>
                `;
                itemsContainer.insertAdjacentHTML('beforeend', html);
            });
        }
    }

    const shippingCostText = document.getElementById('shippingCostText');
    if (shippingCostText) shippingCostText.innerText = formatRp(order.shipping_cost);

    const totalAmountText = document.getElementById('totalAmountText');
    if (totalAmountText) totalAmountText.innerText = formatRp(order.total_amount);
}