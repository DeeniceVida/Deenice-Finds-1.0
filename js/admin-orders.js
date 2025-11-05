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
        
        if (!this.token || !this.isValidToken(this.token)) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
        this.startSyncMonitoring();
    }

    // Validate token structure
    isValidToken(token) {
        try {
            // JWT tokens are in format: header.payload.signature
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            const payload = JSON.parse(atob(parts[1]));
            return payload && payload.username && payload.role === 'admin';
        } catch (e) {
            console.error('Invalid token format:', e);
            return false;
        }
    }

    // Enhanced API request with better error handling
    async makeRequest(endpoint, options = {}) {
        try {
            console.log(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            };

            if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
                config.body = options.body;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            clearTimeout(timeoutId);

            console.log(`📡 Response: ${response.status} for ${endpoint}`);

            if (response.status === 401) {
                this.showNotification('Session expired. Please login again.', 'error');
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                let errorData = { error: `HTTP ${response.status}` };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignore JSON parse errors
                }
                
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`❌ API Request Failed for ${endpoint}:`, error);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server is not responding');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error - check your internet connection');
            } else {
                throw error;
            }
        }
    }

    // FIXED: Load orders with proper error handling
    async loadOrdersFromBackend() {
        try {
            console.log('📥 Loading orders from backend...');
            const data = await this.makeRequest('/orders');
            
            // Handle different response structures
            if (data.orders && Array.isArray(data.orders)) {
                this.orders = data.orders;
                console.log('✅ Loaded orders from backend:', this.orders.length);
            } else if (Array.isArray(data)) {
                this.orders = data;
                console.log('✅ Loaded orders as direct array:', this.orders.length);
            } else {
                console.warn('⚠️ Unexpected response format:', data);
                this.orders = [];
            }
            
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            this.showNotification('Backend unavailable. Using local data.', 'error');
            this.loadOrdersFromLocalStorage();
        }
    }

    // Load from localStorage as fallback
    loadOrdersFromLocalStorage() {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            if (localOrders.length > 0) {
                this.orders = localOrders;
                console.log('✅ Loaded orders from localStorage:', this.orders.length);
            } else {
                console.log('📭 No orders found anywhere');
                this.orders = [];
            }
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.orders = [];
        }
    }

    // FIXED: Status update with comprehensive error handling
    async updateStatus(orderId, newStatus) {
        try {
            console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
            
            // 1. Find the order locally
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error(`Order ${orderId} not found locally`);
            }

            const oldStatus = order.status;
            
            // 2. Update locally first for immediate feedback
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            // 3. Update UI immediately
            this.renderStats();
            this.renderOrders();
            
            // 4. Try to update backend
            try {
                await this.makeRequest(`/orders/${orderId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus })
                });
                console.log('✅ Backend update successful');
                
            } catch (backendError) {
                console.error('❌ Backend update failed:', backendError);
                
                // If it's a 404, the order might not exist on server
                if (backendError.message.includes('404') || backendError.message.includes('not found')) {
                    console.log('🔄 Order not found on server, attempting to create it...');
                    await this.createOrderOnServer(order);
                    
                    // Retry the status update
                    await this.makeRequest(`/orders/${orderId}/status`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: newStatus })
                    });
                    console.log('✅ Order created and status updated on server');
                } else {
                    throw backendError;
                }
            }

            // 5. Update localStorage
            this.updateLocalStorageOrder(orderId, newStatus);
            
            // 6. Show success
            this.showNotification(
                `Order #${orderId} updated from ${oldStatus} to ${newStatus}`,
                'success'
            );
            
        } catch (error) {
            console.error('❌ Status update failed:', error);
            
            // Revert local changes if backend failed
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                // Keep the new status but mark as unsynced
                order.unsynced = true;
                this.renderOrders();
            }
            
            this.showNotification(
                `Update failed: ${error.message}. Changes saved locally.`,
                'error'
            );
        }
    }

    // Create order on server if it doesn't exist
    async createOrderOnServer(order) {
        try {
            console.log('🔄 Creating order on server:', order.id);
            
            const orderData = {
                id: order.id,
                customer: order.customer || {
                    name: order.name,
                    city: order.city,
                    phone: order.phone
                },
                items: order.items || [],
                totalAmount: order.totalAmount || order.total || 0,
                currency: order.currency || 'KES',
                orderDate: order.orderDate || new Date().toISOString(),
                status: order.status || 'pending',
                delivery: order.delivery || { method: 'home' }
            };

            await this.makeRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            
            console.log('✅ Order created on server');
            
        } catch (error) {
            console.error('❌ Failed to create order on server:', error);
            throw new Error('Could not create order on server: ' + error.message);
        }
    }

    // Update localStorage
    updateLocalStorageOrder(orderId, newStatus) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const orderIndex = localOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                localOrders[orderIndex].status = newStatus;
                localOrders[orderIndex].statusUpdated = new Date().toISOString();
                if (newStatus === 'completed') {
                    localOrders[orderIndex].completedDate = new Date().toISOString();
                }
                localStorage.setItem('de_order_history', JSON.stringify(localOrders));
            }
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // Delete order
    async deleteOrder(orderId) {
        if (!confirm(`Are you sure you want to delete order #${orderId}? This cannot be undone.`)) {
            return;
        }

        try {
            // Remove locally first
            this.orders = this.orders.filter(order => order.id !== orderId);
            this.renderStats();
            this.renderOrders();
            
            // Try to delete from backend
            try {
                await this.makeRequest(`/orders/${orderId}`, { method: 'DELETE' });
            } catch (error) {
                console.log('⚠️ Backend delete failed, but removed locally');
            }
            
            // Remove from localStorage
            this.removeOrderFromLocalStorage(orderId);
            
            this.showNotification(`Order #${orderId} deleted`, 'success');
            
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    removeOrderFromLocalStorage(orderId) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const updatedOrders = localOrders.filter(order => order.id !== orderId);
            localStorage.setItem('de_order_history', JSON.stringify(updatedOrders));
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Enhanced notification system
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.admin-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#FF3B30' : '#007AFF'};
            word-break: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // Render methods (same as before)
    renderStats() {
        const stats = {
            total: this.orders.length,
            pending: this.orders.filter(o => o.status === 'pending').length,
            processing: this.orders.filter(o => o.status === 'processing').length,
            completed: this.orders.filter(o => o.status === 'completed').length,
            cancelled: this.orders.filter(o => o.status === 'cancelled').length
        };

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
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        if (filteredOrders.length === 0) {
            container.innerHTML = this.getNoResultsState();
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderRow(order)).join('');
    }

    createOrderRow(order) {
        const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleDateString();
        const customerName = order.customer?.name || order.name || 'N/A';
        const customerCity = order.customer?.city || order.city || 'N/A';
        const totalAmount = order.totalAmount || order.total || 0;
        const currency = order.currency || 'KES';
        const status = order.status || 'pending';
        const items = order.items || [];

        return `
            <tr data-order-id="${order.id}">
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${customerName}</div>
                        <div class="customer-email">${customerCity}</div>
                    </div>
                </td>
                <td>${orderDate}</td>
                <td>
                    <div class="order-items-preview">
                        ${items.slice(0, 2).map(item => 
                            `<div class="order-item-preview">
                                <div class="item-name-small">${item.title || item.name}</div>
                            </div>`
                        ).join('')}
                        ${items.length > 2 ? `<div class="item-name-small">+${items.length - 2} more</div>` : ''}
                    </div>
                </td>
                <td><strong>${currency} ${totalAmount.toLocaleString()}</strong></td>
                <td>
                    <select class="status-select ${this.getStatusClass(status)}" 
                            onchange="adminManager.updateStatus('${order.id}', this.value)"
                            style="padding: 6px 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 12px; cursor: pointer; background: white; min-width: 120px;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>📝 Pending</option>
                        <option value="processing" ${status === 'processing' ? 'selected' : ''}>🔄 Processing</option>
                        <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                    ${order.unsynced ? '<br><small style="color: orange;">⚠️ Not synced</small>' : ''}
                </td>
                <td>
                    <div class="actions">
                        <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">View</button>
                        <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">Contact</button>
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    // ... include the rest of your helper methods (getStatusClass, filterOrders, etc.)
    getStatusClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    }

    filterOrders() {
        if (this.currentFilter === 'all') return this.orders;
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    getEmptyState() {
        return `<tr><td colspan="7" class="empty-state"><h3>No orders found</h3></td></tr>`;
    }

    getNoResultsState() {
        return `<tr><td colspan="7" class="empty-state"><h3>No orders match this filter</h3></td></tr>`;
    }

    setupEventListeners() {
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

    startSyncMonitoring() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadOrdersFromBackend().then(() => {
                this.renderStats();
                this.renderOrders();
            });
        }, 30000);
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'admin-login.html';
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            alert(`Order #${order.id}\nCustomer: ${order.customer?.name}\nStatus: ${order.status}`);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.customer?.phone) {
            const phone = order.customer.phone;
            const message = `Hello ${order.customer.name}, this is Deenice Finds regarding your order #${orderId}.`;
            const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
        } else {
            alert('No phone number available for this order');
        }
    }
}

// Initialize the single admin manager
const adminManager = new AdminOrderManager();
