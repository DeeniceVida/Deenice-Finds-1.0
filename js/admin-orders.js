class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        console.log('🔄 AdminOrderManager initializing...');
        this.loadOrders();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
        this.debugOrders(); // Add debug function
    }

    debugOrders() {
        console.log('=== DEBUG ORDERS ===');
        console.log('📦 Total orders found:', this.orders.length);
        console.log('📁 Raw localStorage data:', localStorage.getItem('de_order_history'));
        
        if (this.orders.length > 0) {
            console.log('📋 Orders details:');
            this.orders.forEach((order, index) => {
                console.log(`Order ${index + 1}:`, {
                    id: order.id,
                    status: order.status,
                    customer: order.customer,
                    items: order.items?.length,
                    total: order.totalAmount,
                    delivery: order.delivery
                });
            });
        } else {
            console.log('❌ No orders found in localStorage');
            
            // Check if there are orders under different keys
            console.log('🔍 Checking all localStorage keys:');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('order') || key.includes('cart')) {
                    console.log(`Key: ${key}`, localStorage.getItem(key));
                }
            }
        }
        console.log('=== END DEBUG ===');
    }

    loadOrders() {
        try {
            console.log('📥 Loading orders from localStorage...');
            const savedOrders = localStorage.getItem('de_order_history');
            
            if (!savedOrders) {
                console.log('❌ No orders found in de_order_history');
                this.orders = [];
                return;
            }

            this.orders = JSON.parse(savedOrders);
            console.log('✅ Parsed orders:', this.orders);

            // Ensure orders have proper structure
            this.orders = this.orders.map((order, index) => {
                // Fix common data issues
                const fixedOrder = {
                    id: order.id || `UNKNOWN_${Date.now()}_${index}`,
                    orderDate: order.orderDate || new Date().toISOString(),
                    status: order.status || 'pending',
                    customer: order.customer || { name: 'Unknown Customer', city: 'Unknown City' },
                    delivery: order.delivery || { method: 'delivery', city: 'Unknown City' },
                    items: order.items || [],
                    totalAmount: order.totalAmount || 0,
                    currency: order.currency || 'KES',
                    statusUpdated: order.statusUpdated,
                    completedDate: order.completedDate,
                    ...order
                };

                // Ensure items array is properly formatted
                if (fixedOrder.items && Array.isArray(fixedOrder.items)) {
                    fixedOrder.items = fixedOrder.items.map(item => ({
                        title: item.title || 'Unknown Item',
                        price: item.price || 0,
                        qty: item.qty || 1,
                        currency: item.currency || 'KES',
                        color: item.color,
                        size: item.size,
                        model: item.model,
                        img: item.img || 'https://via.placeholder.com/50',
                        ...item
                    }));
                }

                return fixedOrder;
            });

            // Sort by date (newest first)
            this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            console.log('✅ Final processed orders:', this.orders);

        } catch (error) {
            console.error('❌ Error loading orders:', error);
            console.error('Error details:', error.message);
            this.orders = [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem('de_order_history', JSON.stringify(this.orders));
            console.log('💾 Orders saved to localStorage:', this.orders.length);
        } catch (error) {
            console.error('❌ Error saving orders:', error);
        }
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Add refresh button listener
        const refreshBtn = document.getElementById('refreshOrders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadOrders();
                this.renderStats();
                this.renderOrders();
                alert('Orders refreshed!');
            });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderOrders();
    }

    renderStats() {
        const stats = {
            total: this.orders.length,
            pending: this.orders.filter(o => o.status === 'pending').length,
            processing: this.orders.filter(o => o.status === 'processing').length,
            completed: this.orders.filter(o => o.status === 'completed').length,
            cancelled: this.orders.filter(o => o.status === 'cancelled').length
        };

        console.log('📊 Rendering stats:', stats);

        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number stat-total">${stats.total}</div>
                    <div>Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-pending">${stats.pending}</div>
                    <div>Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-processing">${stats.processing}</div>
                    <div>Processing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-completed">${stats.completed}</div>
                    <div>Completed</div>
                </div>
            `;
        }
    }

    renderOrders() {
        const container = document.getElementById('ordersList') || document.getElementById('orders-list');
        
        console.log('🎨 Rendering orders to container:', container);
        console.log('🔍 Current filter:', this.currentFilter);
        console.log('📋 Orders to render:', this.orders.length);

        if (this.orders.length === 0) {
            console.log('🔄 Showing empty state');
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        console.log('✅ Filtered orders:', filteredOrders.length);
        
        if (filteredOrders.length === 0) {
            console.log('🔄 Showing no results state');
            container.innerHTML = this.getNoResultsState();
            return;
        }

        console.log('🖼️ Creating order cards...');
        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
        console.log('✅ Orders rendered successfully');
    }

    filterOrders() {
        if (this.currentFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    createOrderCard(order) {
        console.log('🛠️ Creating card for order:', order.id);
        
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
                            <span>👤 ${order.customer?.name || 'N/A'}</span>
                            <span>📍 ${order.delivery?.city || 'N/A'}</span>
                            <span>🚚 ${this.getDeliveryText(order.delivery)}</span>
                            ${order.delivery?.pickupCode ? `<span>🔑 ${order.delivery.pickupCode}</span>` : ''}
                        </div>
                    </div>
                    <div>
                        <select class="status-select ${this.getStatusClass(order.status)}" 
                                onchange="adminManager.updateStatus('${order.id}', this.value)"
                                style="color: inherit;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <div class="order-items">
                    ${(order.items || []).map(item => this.createOrderItem(item)).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: ${order.currency} ${order.totalAmount?.toLocaleString() || '0'}
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-secondary" onclick="adminManager.viewOrderDetails('${order.id}')">
                            View Details
                        </button>
                        <button class="btn btn-primary" onclick="adminManager.contactCustomer('${order.id}')">
                            Contact Customer
                        </button>
                        <button class="btn btn-danger" onclick="adminManager.deleteOrder('${order.id}')">
                            Delete
                        </button>
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
                <img src="${item.img || 'https://via.placeholder.com/50'}" 
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

    getDeliveryText(delivery) {
        if (!delivery || !delivery.method) return 'Delivery info missing';
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

    updateStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            this.saveOrders();
            this.renderStats();
            this.renderOrders();
            
            alert(`Order #${orderId} status updated to ${newStatus}`);
        }
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const details = `
Order #${order.id} - Details

CUSTOMER INFORMATION:
Name: ${order.customer?.name || 'N/A'}
City: ${order.customer?.city || 'N/A'}

ORDER INFORMATION:
Status: ${this.getStatusText(order.status)}
Order Date: ${new Date(order.orderDate).toLocaleString()}
Last Updated: ${order.statusUpdated ? new Date(order.statusUpdated).toLocaleString() : 'N/A'}
${order.completedDate ? `Completed: ${new Date(order.completedDate).toLocaleString()}` : ''}

DELIVERY:
Method: ${this.getDeliveryText(order.delivery)}
${order.delivery?.pickupCode ? `Pickup Code: ${order.delivery.pickupCode}` : ''}

ITEMS (${order.items?.length || 0}):
${order.items ? order.items.map((item, index) => 
    `${index + 1}. ${item.title} - ${item.qty} × ${item.currency} ${item.price}`
).join('\n') : 'No items'}

TOTAL: ${order.currency} ${order.totalAmount?.toLocaleString() || '0'}
            `;
            alert(details);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const config = window.DEENICE_CONFIG || {};
            const whatsappNumber = config.whatsappNumber ? config.whatsappNumber.replace('+', '') : '';
            const message = `Hello ${order.customer?.name || 'there'}, this is Deenice Finds regarding your order #${orderId}.`;
            
            if (whatsappNumber) {
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
            } else {
                alert(`Contact customer for order #${orderId}\n\nMessage: ${message}`);
            }
        }
    }

    deleteOrder(orderId) {
        if (confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)) {
            this.orders = this.orders.filter(order => order.id !== orderId);
            this.saveOrders();
            this.renderStats();
            this.renderOrders();
            alert(`Order #${orderId} has been deleted.`);
        }
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <h3>No orders found</h3>
                <p>There are no orders in the system yet.</p>
                <button class="btn btn-primary" onclick="adminManager.debugOrders()">
                    Debug Orders
                </button>
                <button class="btn btn-secondary" onclick="adminManager.loadOrders(); adminManager.renderOrders();">
                    Refresh
                </button>
            </div>
        `;
    }

    getNoResultsState() {
        return `
            <div class="empty-state">
                <h3>No orders match this filter</h3>
                <p>Try selecting a different filter to see more orders.</p>
                <button class="btn btn-primary" onclick="adminManager.setFilter('all')">
                    Show All Orders
                </button>
            </div>
        `;
    }
}

const adminManager = new AdminOrderManager();
