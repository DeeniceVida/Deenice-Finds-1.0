// Order History Management - WITH REAL-TIME SYNC
class OrderHistory {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadOrders();
        this.renderOrders();
        this.setupEventListeners();
    }

    async loadOrders() {
    try {
        console.log('📥 Loading orders...');
        
        // Try multiple storage locations
        let orders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        
        // If no orders in main storage, check backup
        if (orders.length === 0) {
            const backup = JSON.parse(localStorage.getItem('de_order_history_backup') || '[]');
            if (backup.length > 0) {
                orders = backup;
                localStorage.setItem('de_order_history', JSON.stringify(orders));
                console.log('✅ Restored orders from backup:', orders.length);
            }
        }
        
        // If still no orders, try to sync with server
        if (orders.length === 0 && navigator.onLine) {
            console.log('🔄 No local orders, attempting server sync...');
            if (window.orderSync) {
                orders = await window.orderSync.syncOrders();
            }
        }
        
        this.orders = orders;
        console.log('✅ Final loaded orders:', this.orders.length);

        // Sort orders by date (newest first)
        this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
    } catch (error) {
        console.error('Error loading orders:', error);
        // Final fallback - empty array
        this.orders = [];
    }
}
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Add manual refresh button to empty state
        this.addRefreshButton();
    }

    addRefreshButton() {
        // Create refresh button for empty state
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-primary';
        refreshBtn.innerHTML = '🔄 Refresh Orders';
        refreshBtn.style.marginTop = '10px';
        refreshBtn.onclick = () => this.manualRefresh();

        // Add to empty state if it exists
        const emptyState = document.querySelector('.empty-state');
        if (emptyState && !emptyState.querySelector('.manual-refresh')) {
            refreshBtn.classList.add('manual-refresh');
            emptyState.appendChild(refreshBtn);
        }
    }

    async manualRefresh() {
        try {
            console.log('🔄 Manual refresh triggered');
            
            if (window.orderSync) {
                await window.orderSync.forceSync();
                await this.loadOrders();
                this.renderOrders();
                alert('✅ Orders refreshed from server!');
            } else {
                await this.loadOrders();
                this.renderOrders();
                alert('✅ Orders reloaded!');
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            alert('❌ Refresh failed. Please try again.');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderOrders();
    }

    renderOrders() {
        const container = document.getElementById('orders-container');
        
        if (this.orders.length === 0) {
            container.innerHTML = this.getEmptyState();
            this.addRefreshButton();
            return;
        }

        const filteredOrders = this.filterOrders();
        
        if (filteredOrders.length === 0) {
            container.innerHTML = this.getNoResultsState();
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    filterOrders() {
        if (this.currentFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    createOrderCard(order) {
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusUpdated = order.statusUpdated ? 
            new Date(order.statusUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '';

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id}</h3>
                        <div class="order-meta">
                            <span>📅 ${orderDate}</span>
                            <span>📍 ${order.customer?.city || order.delivery?.city || 'N/A'}</span>
                            <span>🚚 ${this.getDeliveryText(order)}</span>
                            ${statusUpdated ? `<span>📝 ${statusUpdated}</span>` : ''}
                        </div>
                    </div>
                    <div class="order-status ${this.getStatusClass(order.status)}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-items">
                    ${(order.items || []).map(item => this.createOrderItem(item)).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: ${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-secondary" onclick="orderHistory.viewOrderDetails('${order.id}')">
                            View Details
                        </button>
                        ${order.status === 'completed' ? `
                            <button class="btn btn-primary" onclick="orderHistory.reorder('${order.id}')">
                                Reorder
                            </button>
                        ` : ''}
                        ${order.status === 'pending' || order.status === 'processing' ? `
                            <button class="btn btn-secondary" onclick="orderHistory.contactSupport('${order.id}')">
                                Contact Support
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="orderHistory.refreshOrder('${order.id}')">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                
                ${this.getStatusMessage(order)}
            </div>
        `;
    }

    getStatusMessage(order) {
        const messages = {
            'pending': `
                <div class="status-message pending">
                    <p>📝 <strong>Your order is being reviewed.</strong> We'll start processing it shortly.</p>
                    <small>You'll receive a WhatsApp notification when we start processing your order</small>
                </div>
            `,
            'processing': `
                <div class="status-message processing">
                    <p>🔄 <strong>Your order is being processed.</strong> We're preparing your items for ${this.getDeliveryText(order) === 'Store Pickup' ? 'pickup' : 'delivery'}.</p>
                    <small>You'll receive a WhatsApp notification when your order is ready</small>
                </div>
            `,
            'completed': `
                <div class="status-message completed">
                    <p>✅ <strong>Order completed!</strong> ${this.getDeliveryText(order) === 'Store Pickup' ? 
                        'Ready for pickup at our store.' : 
                        'Delivered to your address.'}
                    ${order.completedDate ? `Completed on ${new Date(order.completedDate).toLocaleDateString()}` : ''}</p>
                </div>
            `,
            'cancelled': `
                <div class="status-message cancelled">
                    <p>❌ <strong>Order cancelled.</strong> Contact support for more information.</p>
                </div>
            `
        };
        
        return messages[order.status] || '';
    }

    createOrderItem(item) {
        const specs = [];
        if (item.color) specs.push(`Color: ${item.color}`);
        if (item.size) specs.push(`Size: ${item.size}`);
        if (item.model && item.model !== 'Standard') specs.push(`Model: ${item.model}`);

        return `
            <div class="order-item">
                <img src="${item.img || 'https://via.placeholder.com/60'}" 
                     alt="${item.title}" 
                     class="item-image">
                <div class="item-details">
                    <h4>${item.title || 'Unknown Item'}</h4>
                    ${specs.length > 0 ? `
                        <div class="item-specs">${specs.join(' • ')}</div>
                    ` : ''}
                    <div class="item-price">
                        ${item.qty || 1} × ${item.currency || 'KES'} ${(item.price || 0).toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }

    getDeliveryText(order) {
        if (!order.delivery) return 'Delivery';
        return order.delivery.method === 'pickup' ? 'Store Pickup' : 'Home Delivery';
    }

    getStatusClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusTexts[status] || 'Pending';
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <h3>No orders yet</h3>
                <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
                <a href="index.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
    }

    getNoResultsState() {
        return `
            <div class="empty-state">
                <h3>No orders found</h3>
                <p>No orders match the current filter. Try selecting a different filter.</p>
                <button class="btn btn-primary" onclick="orderHistory.setFilter('all')">
                    Show All Orders
                </button>
            </div>
        `;
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const details = `
Order Details for #${order.id}

Status: ${this.getStatusText(order.status)}
Order Date: ${new Date(order.orderDate).toLocaleString()}
${order.statusUpdated ? `Last Updated: ${new Date(order.statusUpdated).toLocaleString()}` : ''}
${order.completedDate ? `Completed: ${new Date(order.completedDate).toLocaleString()}` : ''}

Delivery: ${this.getDeliveryText(order)}
${order.customer?.city ? `City: ${order.customer.city}` : ''}
${order.delivery?.pickupCode ? `Pickup Code: ${order.delivery.pickupCode}` : ''}

Items: ${order.items?.length || 0} item(s)
Total: ${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}

Customer: ${order.customer?.name || 'N/A'}
Phone: ${order.customer?.phone || 'Not provided'}
            `;
            alert(details);
        }
    }

    async refreshOrder(orderId) {
        try {
            await this.manualRefresh();
        } catch (error) {
            alert('Error refreshing order');
        }
    }

    reorder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Add all items from the order to the cart
            const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
            
            order.items.forEach(item => {
                // Check if item already exists in cart
                const existingItemIndex = cart.findIndex(cartItem => 
                    cartItem.title === item.title && 
                    cartItem.color === item.color && 
                    cartItem.size === item.size
                );

                if (existingItemIndex > -1) {
                    // Update quantity if item exists
                    cart[existingItemIndex].qty += item.qty;
                } else {
                    // Add new item to cart
                    cart.push({
                        ...item,
                        id: Date.now().toString() // New unique ID for cart item
                    });
                }
            });

            localStorage.setItem('de_cart', JSON.stringify(cart));
            
            alert('All items from this order have been added to your cart!');
            
            // Redirect to cart page
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
        }
    }
    // Add to OrderHistory class in order-history.js
setupRealTimeUpdates() {
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'de_order_history') {
            console.log('🔄 Storage update detected, refreshing orders...');
            this.loadOrders().then(() => this.renderOrders());
        }
    });

    // Listen for custom sync events
    window.addEventListener('manualRefresh', () => {
        this.loadOrders().then(() => this.renderOrders());
    });

    // Auto-refresh when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('📱 Page visible, checking for updates...');
            this.loadOrders().then(() => this.renderOrders());
        }
    });
}

// Call this in init()
async init() {
    await this.loadOrders();
    this.renderOrders();
    this.setupEventListeners();
    this.setupRealTimeUpdates(); // Add this line
}

    contactSupport(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const message = `Hello, I have a question about my order #${orderId} (Status: ${this.getStatusText(order.status)}).`;
            const encodedMessage = encodeURIComponent(message);
            const config = window.DEENICE_CONFIG || {};
            const whatsappNumber = config.whatsappNumber ? config.whatsappNumber.replace('+', '') : '';
            
            if (whatsappNumber) {
                window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
            } else {
                alert(`Contact support for order #${orderId}\n\nMessage: ${message}`);
            }
        }
    }
}

// Initialize order history when page loads
const orderHistory = new OrderHistory();

// Export function to add orders from other pages
window.addOrderToHistory = function(orderData) {
    const existingOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
    const newOrder = {
        id: orderData.id || 'DF' + Date.now().toString(36).toUpperCase(),
        orderDate: new Date().toISOString(),
        status: 'pending',
        ...orderData
    };
    existingOrders.unshift(newOrder);
    localStorage.setItem('de_order_history', JSON.stringify(existingOrders));
    
    // Refresh the order history display if on the page
    if (typeof orderHistory !== 'undefined') {
        orderHistory.loadOrders();
        orderHistory.renderOrders();
    }
    
    return newOrder.id;
};
