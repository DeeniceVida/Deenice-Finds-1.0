class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing...');
        console.log('🔑 Token exists:', !!this.token);
        
        if (!this.token) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
    }

    // Add this method to your AdminOrderManager class in admin-orders.js
async deleteOrder(orderId) {
    try {
        const confirmDelete = confirm(
            `🗑️ DELETE ORDER #${orderId}\n\n` +
            `Are you sure you want to delete this order?\n\n` +
            `This will remove the order from:\n` +
            `• Admin panel\n` +
            `• Backend server\n` +
            `• Customer's order history\n\n` +
            `This action cannot be undone!`
        );
        
        if (!confirmDelete) return;

        console.log('🗑️ Deleting order:', orderId);
        
        // 1. Delete from backend
        await this.makeRequest(`/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        console.log('✅ Order deleted from backend');

        // 2. Remove from local state
        this.orders = this.orders.filter(order => order.id !== orderId);
        
        // 3. Update UI
        this.renderStats();
        this.renderOrders();
        
        alert(`✅ Order #${orderId} has been deleted successfully!`);
        
    } catch (error) {
        console.error('Failed to delete order:', error);
        alert('Failed to delete order: ' + error.message);
    }
}

    async makeRequest(endpoint, options = {}) {
        try {
            console.log(`🌐 Making request to: ${this.baseURL}${endpoint}`);
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log(`📡 Response status: ${response.status}`);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response not OK:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Response data:', data);
            return data;
            
        } catch (error) {
            console.error('❌ API request failed:', error);
            throw error;
        }
    }

    async loadOrdersFromBackend() {
        try {
            console.log('📥 Loading orders from backend...');
            const data = await this.makeRequest('/orders');
            
            // Handle different response structures
            if (data.orders && Array.isArray(data.orders)) {
                this.orders = data.orders;
                console.log('✅ Loaded orders from data.orders:', this.orders.length);
            } else if (Array.isArray(data)) {
                this.orders = data;
                console.log('✅ Loaded orders from direct array:', this.orders.length);
            } else if (data && typeof data === 'object') {
                // Try to find orders array in the response object
                const possibleKeys = ['orders', 'order', 'data', 'items'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        this.orders = data[key];
                        console.log(`✅ Loaded orders from data.${key}:`, this.orders.length);
                        break;
                    }
                }
                
                if (this.orders.length === 0) {
                    console.log('⚠️ No array found in response, checking if single order:', data);
                    // Check if it's a single order object
                    if (data.id && data.items) {
                        this.orders = [data];
                        console.log('✅ Loaded single order:', this.orders.length);
                    }
                }
            }
            
            if (this.orders.length === 0) {
                console.log('⚠️ No orders found in backend response, using localStorage fallback');
                this.loadOrdersFromLocalStorage();
            }
            
            console.log('📋 Final orders array:', this.orders);
            
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            console.log('🔄 Falling back to localStorage...');
            this.loadOrdersFromLocalStorage();
        }
    }

    loadOrdersFromLocalStorage() {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            console.log('📥 Loading from localStorage:', localOrders.length, 'orders');
            
            if (localOrders.length > 0) {
                this.orders = localOrders;
                console.log('✅ Loaded orders from localStorage:', this.orders.length);
            } else {
                console.log('📭 No orders found in localStorage either');
                this.orders = [];
            }
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.orders = [];
        }
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
                <div class="stat-card">
                    <div class="stat-number stat-cancelled">${stats.cancelled}</div>
                    <div>Cancelled</div>
                </div>
            `;
        }
    }

    renderOrders() {
        const container = document.getElementById('ordersTableBody');
        
        console.log('🎨 Rendering orders to table...');
        console.log('📋 Orders count:', this.orders.length);
        console.log('🔍 Current filter:', this.currentFilter);

        if (!container) {
            console.error('❌ ordersTableBody container not found!');
            return;
        }

        if (this.orders.length === 0) {
            console.log('📭 No orders to display');
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        console.log('✅ Filtered orders count:', filteredOrders.length);
        
        if (filteredOrders.length === 0) {
            console.log('🔍 No orders match current filter');
            container.innerHTML = this.getNoResultsState();
            return;
        }

        console.log('🖼️ Creating table rows for orders...');
        container.innerHTML = filteredOrders.map(order => this.createOrderRow(order)).join('');
        console.log('✅ Orders rendered successfully');
    }

    filterOrders() {
        if (this.currentFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    createOrderRow(order) {
        console.log('🛠️ Creating row for order:', order);
        
        if (!order) {
            console.error('❌ Invalid order object');
            return '';
        }

        const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const customerName = order.customer?.name || order.name || 'N/A';
        const customerCity = order.customer?.city || order.city || 'N/A';
        const customerPhone = order.customer?.phone || order.phone || 'No phone';
        const totalAmount = order.totalAmount || order.total || 0;
        const currency = order.currency || 'KES';
        const status = order.status || 'pending';
        const items = order.items || [];

        console.log(`📦 Order ${order.id}:`, {
            customerName,
            customerCity,
            customerPhone,
            totalAmount,
            status,
            itemsCount: items.length
        });

        return `
            <tr data-order-id="${order.id}">
                <td>
                    <strong>#${order.id || 'N/A'}</strong>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${customerName}</div>
                        <div class="customer-email">${customerCity}</div>
                        <div class="customer-email">${customerPhone}</div>
                    </div>
                </td>
                <td>${orderDate}</td>
                <td>
                    <div class="order-items-preview">
                        ${items.slice(0, 2).map(item => this.createOrderItemPreview(item)).join('')}
                        ${items.length > 2 ? 
                            `<div class="item-name-small">+${items.length - 2} more items</div>` : 
                            ''}
                        ${items.length === 0 ? 
                            `<div class="item-name-small">No items</div>` : 
                            ''}
                    </div>
                </td>
                <td>
                    <strong>${currency} ${totalAmount.toLocaleString()}</strong>
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(status)}">
                        ${status}
                    </span>
                    <select class="status-select" 
                            onchange="adminManager.updateStatus('${order.id}', this.value)"
                            style="display: none; margin-top: 5px;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <div class="actions">
                        <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">
                            View
                        </button>
                        <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">
                            Contact
                        </button>
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')" 
                                style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    createOrderItemPreview(item) {
        if (!item) return '';
        
        const title = item.title || item.name || 'Unknown Item';
        const imageUrl = item.img || item.image || 'https://via.placeholder.com/30x30?text=No+Image';
        
        return `
            <div class="order-item-preview">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     class="item-image-small"
                     onerror="this.src='https://via.placeholder.com/30x30?text=No+Image'">
                <div class="item-name-small">${title}</div>
            </div>
        `;
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

    async updateStatus(orderId, newStatus) {
        try {
            console.log('🔄 Updating order status:', orderId, newStatus);
            
            // Update locally first for immediate feedback
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                this.renderStats();
                this.renderOrders();
            }
            
            // Then update in backend
            await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            alert(`✅ Order #${orderId} status updated to ${newStatus}!`);
            
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status: ' + error.message);
            
            // Reload orders to get correct state
            await this.loadOrdersFromBackend();
            this.renderStats();
            this.renderOrders();
        }
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const details = `
Order #${order.id} - Details

CUSTOMER INFORMATION:
Name: ${order.customer?.name || order.name || 'N/A'}
City: ${order.customer?.city || order.city || 'N/A'}
Phone: ${order.customer?.phone || order.phone || 'Not provided'}

ORDER INFORMATION:
Status: ${order.status || 'pending'}
Order Date: ${new Date(order.orderDate || order.date).toLocaleString()}
Total: ${order.currency || 'KES'} ${(order.totalAmount || order.total || 0).toLocaleString()}

ITEMS (${(order.items || []).length}):
${order.items ? order.items.map((item, index) => 
    `${index + 1}. ${item.title || item.name} - ${item.qty || 1} × ${item.currency || 'KES'} ${(item.price || 0).toLocaleString()}`
).join('\n') : 'No items'}
            `;
            alert(details);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && (order.customer?.phone || order.phone)) {
            const phone = order.customer?.phone || order.phone;
            const message = `Hello ${order.customer?.name || order.name || 'there'}, this is Deenice Finds regarding your order #${orderId}.`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
        } else {
            alert(`No phone number available for order #${orderId}`);
        }
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
                    <button class="btn btn-primary" onclick="adminManager.debugOrders()">
                        Debug Info
                    </button>
                    <button class="btn btn-secondary" onclick="adminManager.loadOrdersFromBackend()">
                        Retry Backend
                    </button>
                </td>
            </tr>
        `;
    }

    getNoResultsState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders match this filter</h3>
                    <p>Try selecting a different filter to see more orders.</p>
                    <button class="btn btn-primary" onclick="adminManager.setFilter('all')">
                        Show All Orders
                    </button>
                </td>
            </tr>
        `;
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
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderOrders();
    }

    // Debug function
    debugOrders() {
        console.log('=== DEBUG ORDERS ===');
        console.log('Total orders:', this.orders.length);
        console.log('Orders array:', this.orders);
        console.log('Current filter:', this.currentFilter);
        console.log('Backend URL:', this.baseURL);
        console.log('Token exists:', !!this.token);
        console.log('LocalStorage orders:', JSON.parse(localStorage.getItem('de_order_history') || '[]'));
        
        alert(`Debug Info:\nTotal Orders: ${this.orders.length}\nFilter: ${this.currentFilter}\nCheck console for details.`);
    }

    // Public method for refresh button
    async loadOrders() {
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
    }
}

// Initialize admin manager
const adminManager = new AdminOrderManager();
