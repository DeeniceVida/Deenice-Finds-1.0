// Order History Management
class OrderHistory {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadOrders();
        this.renderOrders();
        this.setupEventListeners();
    }

    loadOrders() {
        // Load orders from localStorage
        const savedOrders = localStorage.getItem('de_order_history');
        this.orders = savedOrders ? JSON.parse(savedOrders) : [];
        
        // Sort orders by date (newest first)
        this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    saveOrders() {
        localStorage.setItem('de_order_history', JSON.stringify(this.orders));
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
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

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id}</h3>
                        <div class="order-meta">
                            <span>📅 ${orderDate}</span>
                            <span>📍 ${order.delivery.city}</span>
                            <span>🚚 ${this.getDeliveryText(order.delivery)}</span>
                        </div>
                    </div>
                    <div class="order-status ${this.getStatusClass(order.status)}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => this.createOrderItem(item)).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: ${order.currency} ${order.totalAmount.toLocaleString()}
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
                    </div>
                </div>
            </div>
        `;
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
                    <h4>${item.title}</h4>
                    ${specs.length > 0 ? `
                        <div class="item-specs">${specs.join(' • ')}</div>
                    ` : ''}
                    <div class="item-price">
                        ${item.qty} × ${item.currency} ${item.price.toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }

    getDeliveryText(delivery) {
        return delivery.method === 'pickup' ? 'Store Pickup' : 'Home Delivery';
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
            // You can implement a detailed order view modal here
            alert(`Order Details for #${order.id}\n\nStatus: ${this.getStatusText(order.status)}\nDelivery: ${this.getDeliveryText(order.delivery)}\nTotal: ${order.currency} ${order.totalAmount.toLocaleString()}`);
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

    // Method to add a new order (call this when an order is placed)
    addOrder(orderData) {
        const newOrder = {
            id: this.generateOrderId(),
            orderDate: new Date().toISOString(),
            status: 'pending', // default status
            ...orderData
        };

        this.orders.unshift(newOrder); // Add to beginning of array
        this.saveOrders();
        this.renderOrders();
    }

    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    }

    // Method to update order status (for admin use)
    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveOrders();
            this.renderOrders();
        }
    }
}

// Initialize order history when page loads
const orderHistory = new OrderHistory();

// Export function to add orders from other pages
window.addOrderToHistory = function(orderData) {
    orderHistory.addOrder(orderData);
};
