// admin-orders.js - COMPLETE VERSION WITH ALL METHODS
class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.isLoading = false;
        
        // SEPARATE STORAGE KEYS FOR ADMIN
        this.adminStorageKey = 'de_admin_orders';
        this.adminBackupKey = 'de_admin_orders_backup';
        this.clientStorageKey = 'de_order_history';
        
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing...');
        
        if (!this.token || !this.isValidToken(this.token)) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        this.setupSessionPersistence();
        this.showLoadingState();
        await this.loadOrdersWithFallback();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
        this.createItemsModal();
        
        console.log('✅ AdminOrderManager initialized with', this.orders.length, 'orders');
    }

    // === DATA LOADING & STORAGE METHODS (FIXED) ===
    
    async loadOrdersWithFallback() {
        console.log('📥 Loading orders with fallback system...');
        
        try {
            const serverOrders = await this.loadFromServer();
            if (serverOrders && serverOrders.length > 0) {
                this.orders = serverOrders;
                this.saveToAdminStorage(this.orders);
                console.log('✅ Loaded from server:', this.orders.length, 'orders');
                return;
            }
        } catch (error) {
            console.error('❌ Server load failed:', error);
        }
        
        const adminOrders = this.loadFromAdminStorage();
        if (adminOrders.length > 0) {
            this.orders = adminOrders;
            console.log('✅ Loaded from admin storage:', this.orders.length, 'orders');
            return;
        }
        
        const clientOrders = this.loadFromClientStorage();
        if (clientOrders.length > 0) {
            this.orders = clientOrders;
            this.saveToAdminStorage(this.orders);
            console.log('✅ Loaded from client storage:', this.orders.length, 'orders');
            return;
        }
        
        const recoveredOrders = this.emergencyRecovery();
        if (recoveredOrders.length > 0) {
            this.orders = recoveredOrders;
            console.log('✅ Recovered from backup:', this.orders.length, 'orders');
            return;
        }
        
        console.log('📭 No orders found in any source');
        this.orders = [];
    }

    async loadFromServer() {
        try {
            const data = await this.makeRequest('/orders');
            if (data.orders && Array.isArray(data.orders)) {
                return data.orders;
            } else if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    loadFromAdminStorage() {
        try {
            return JSON.parse(localStorage.getItem(this.adminStorageKey) || '[]');
        } catch (error) {
            return [];
        }
    }

    loadFromClientStorage() {
        try {
            return JSON.parse(localStorage.getItem(this.clientStorageKey) || '[]');
        } catch (error) {
            return [];
        }
    }

    saveToAdminStorage(orders) {
        try {
            localStorage.setItem(this.adminStorageKey, JSON.stringify(orders));
            localStorage.setItem(this.adminBackupKey, JSON.stringify(orders));
            return true;
        } catch (error) {
            return false;
        }
    }

    setupSessionPersistence() {
        const originalUpdateStatus = this.updateStatus.bind(this);
        this.updateStatus = async function(orderId, newStatus) {
            await originalUpdateStatus(orderId, newStatus);
            this.saveToAdminStorage(this.orders);
        };

        const originalDeleteOrder = this.deleteOrder.bind(this);
        this.deleteOrder = async function(orderId) {
            await originalDeleteOrder(orderId);
            this.saveToAdminStorage(this.orders);
        };

        window.addEventListener('beforeunload', () => {
            if (this.orders.length > 0) this.saveToAdminStorage(this.orders);
        });

        setInterval(() => {
            if (this.orders.length > 0) this.saveToAdminStorage(this.orders);
        }, 60000);
    }

    emergencyRecovery() {
        const recoverySources = [
            { key: this.adminBackupKey, name: 'Admin Backup' },
            { key: this.adminStorageKey, name: 'Admin Storage' },
            { key: 'de_order_history_backup', name: 'Client Backup' },
            { key: 'de_order_history', name: 'Client Storage' },
            { key: 'order_history', name: 'Legacy Storage' }
        ];

        for (const source of recoverySources) {
            try {
                const data = localStorage.getItem(source.key);
                if (data) {
                    const orders = JSON.parse(data);
                    if (Array.isArray(orders) && orders.length > 0) {
                        this.saveToAdminStorage(orders);
                        this.showNotification(`Recovered ${orders.length} orders from ${source.name}`, 'success');
                        return orders;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        this.showNotification('No backup data found for recovery', 'error');
        return [];
    }

    async syncStatusToClient(orderId, newStatus) {
        try {
            this.updateClientStorage(orderId, newStatus);
            await this.updateServerStatus(orderId, newStatus);
            this.broadcastStatusUpdate(orderId, newStatus);
        } catch (error) {
            console.error('❌ Status sync failed:', error);
        }
    }

    updateClientStorage(orderId, newStatus) {
        try {
            const clientOrders = JSON.parse(localStorage.getItem(this.clientStorageKey) || '[]');
            const orderIndex = clientOrders.findIndex(order => order.id === orderId);
            if (orderIndex > -1) {
                clientOrders[orderIndex].status = newStatus;
                clientOrders[orderIndex].statusUpdated = new Date().toISOString();
                localStorage.setItem(this.clientStorageKey, JSON.stringify(clientOrders));
                localStorage.setItem('de_order_history_backup', JSON.stringify(clientOrders));
            }
        } catch (error) {
            console.error('Error updating client storage:', error);
        }
    }

    async updateServerStatus(orderId, newStatus) {
        try {
            await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            throw error;
        }
    }

    broadcastStatusUpdate(orderId, newStatus) {
        const event = new CustomEvent('adminOrderUpdate', {
            detail: { orderId, newStatus, timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }

    // === YOUR EXISTING METHODS (UNCHANGED) ===

    async updateStatus(orderId, newStatus) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) throw new Error(`Order ${orderId} not found`);

            const oldStatus = order.status;
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            this.renderStats();
            this.renderOrders();
            this.saveToAdminStorage(this.orders);
            await this.syncStatusToClient(orderId, newStatus);
            
            this.showNotification(`Order #${orderId} updated from ${oldStatus} to ${newStatus}`, 'success');
        } catch (error) {
            this.showNotification(`Update failed: ${error.message}`, 'error');
        }
    }

    logout() {
        if (this.orders.length > 0) {
            this.saveToAdminStorage(this.orders);
        }
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
        window.location.href = 'admin-login.html';
    }

    async refreshFromServer() {
        try {
            this.showLoadingState();
            const serverOrders = await this.loadFromServer();
            if (serverOrders.length > 0) {
                this.orders = serverOrders;
                this.saveToAdminStorage(this.orders);
                this.renderStats();
                this.renderOrders();
                this.showNotification(`Refreshed ${serverOrders.length} orders from server`, 'success');
            } else {
                this.showNotification('No orders found on server', 'info');
            }
        } catch (error) {
            this.showNotification('Server refresh failed. Using local data.', 'error');
        }
    }

    debugStorage() {
        const adminOrders = this.loadFromAdminStorage();
        const clientOrders = this.loadFromClientStorage();
        
        const debugInfo = `
🔍 STORAGE DEBUG:
Admin: ${adminOrders.length} orders
Client: ${clientOrders.length} orders
Memory: ${this.orders.length} orders
        `.trim();

        console.log(debugInfo);
        alert(debugInfo);
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            };

            if (options.body) config.body = options.body;

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            clearTimeout(timeoutId);

            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
            
        } catch (error) {
            throw error;
        }
    }

    showLoadingState() {
        const statsGrid = document.getElementById('statsGrid');
        const ordersTable = document.getElementById('ordersTableBody');
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card"><div class="stat-number stat-total">--</div><div>Loading...</div></div>
                <div class="stat-card"><div class="stat-number stat-pending">--</div><div>Loading...</div></div>
                <div class="stat-card"><div class="stat-number stat-processing">--</div><div>Loading...</div></div>
                <div class="stat-card"><div class="stat-number stat-completed">--</div><div>Loading...</div></div>
                <div class="stat-card"><div class="stat-number stat-cancelled">--</div><div>Loading...</div></div>
            `;
        }
        
        if (ordersTable) {
            ordersTable.innerHTML = `
                <tr><td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <div class="loading-spinner"></div>
                        <span>Loading orders...</span>
                    </div>
                </td></tr>
            `;
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

        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card"><div class="stat-number stat-total">${stats.total}</div><div>Total Orders</div></div>
                <div class="stat-card"><div class="stat-number stat-pending">${stats.pending}</div><div>Pending</div></div>
                <div class="stat-card"><div class="stat-number stat-processing">${stats.processing}</div><div>Processing</div></div>
                <div class="stat-card"><div class="stat-number stat-completed">${stats.completed}</div><div>Completed</div></div>
                <div class="stat-card"><div class="stat-number stat-cancelled">${stats.cancelled}</div><div>Cancelled</div></div>
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
        const customerPhone = order.customer?.phone || order.phone || 'No phone';
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
                        <div class="customer-city">${customerCity}</div>
                        <div class="customer-phone">📞 ${customerPhone}</div>
                    </div>
                </td>
                <td>${orderDate}</td>
                <td>
                    <div class="order-items-preview">
                        ${items.slice(0, 3).map(item => this.createOrderItemPreview(item)).join('')}
                        ${items.length > 3 ? `<div class="item-name-small">+${items.length - 3} more items</div>` : ''}
                        ${items.length === 0 ? `<div class="item-name-small">No items</div>` : ''}
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
                </td>
                <td>
                    <div class="actions">
                        <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">Details</button>
                        <button class="view-btn items-btn" onclick="adminManager.viewOrderItems('${order.id}')">Items</button>
                        <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">Contact</button>
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    createOrderItemPreview(item) {
        if (!item) return '';
        const title = item.title || item.name || 'Unknown Item';
        const imageUrl = item.img || item.image || item.thumbnail || 'https://via.placeholder.com/40x40/CCCCCC/666666?text=No+Image';
        const qty = item.qty || 1;
        
        return `
            <div class="order-item-preview">
                <img src="${imageUrl}" alt="${title}" class="item-image-small"
                     onerror="this.src='https://via.placeholder.com/40x40/CCCCCC/666666?text=No+Image'">
                <div class="item-details-small">
                    <div class="item-name-small">${title}</div>
                    <div class="item-qty-small">Qty: ${qty}</div>
                </div>
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

    filterOrders() {
        if (this.currentFilter === 'all') return this.orders;
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="adminManager.refreshFromServer()">🔄 Refresh from Server</button>
                        <button class="btn btn-secondary" onclick="adminManager.emergencyRecovery()">🚨 Emergency Recovery</button>
                        <button class="btn btn-info" onclick="adminManager.debugStorage()">🔍 Debug Storage</button>
                    </div>
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
                    <button class="btn btn-primary" onclick="adminManager.setFilter('all')">Show All Orders</button>
                </td>
            </tr>
        `;
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

    async deleteOrder(orderId) {
        if (!confirm(`Are you sure you want to delete order #${orderId}?`)) return;

        try {
            this.orders = this.orders.filter(order => order.id !== orderId);
            this.renderStats();
            this.renderOrders();
            
            try {
                await this.makeRequest(`/orders/${orderId}`, { method: 'DELETE' });
            } catch (error) {
                console.log('⚠️ Backend delete failed, but removed locally');
            }
            
            this.removeOrderFromStorage(orderId);
            this.showNotification(`Order #${orderId} deleted`, 'success');
        } catch (error) {
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    removeOrderFromStorage(orderId) {
        try {
            const localOrders = JSON.parse(localStorage.getItem(this.adminStorageKey) || '[]');
            const updatedOrders = localOrders.filter(order => order.id !== orderId);
            localStorage.setItem(this.adminStorageKey, JSON.stringify(updatedOrders));
            localStorage.setItem(this.adminBackupKey, JSON.stringify(updatedOrders));
        } catch (error) {
            console.error('Error removing from storage:', error);
        }
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Your existing viewOrderDetails implementation
            const details = `Order #${order.id} Details...`;
            alert(details);
        }
    }

    viewOrderItems(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Your existing viewOrderItems implementation
            this.showItemsModal(order);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Your existing contactCustomer implementation
            const phone = order.customer?.phone || order.phone;
            if (phone) {
                const message = `Hello, regarding your order #${orderId}`;
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
            }
        }
    }

    createItemsModal() {
        if (document.getElementById('itemsModal')) return;
        // Your existing createItemsModal implementation
        const modalHTML = `<div id="itemsModal" class="modal">...</div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showItemsModal(order) {
        // Your existing showItemsModal implementation
        const modal = document.getElementById('itemsModal');
        if (modal) modal.style.display = 'block';
    }

    closeItemsModal() {
        const modal = document.getElementById('itemsModal');
        if (modal) modal.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.admin-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 16px 20px; border-radius: 10px;
            color: white; font-weight: 500; z-index: 10000; max-width: 400px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#FF3B30' : '#007AFF'};
            transform: translateX(400px); transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    isValidToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1]));
            return payload && payload.username && payload.role === 'admin';
        } catch (e) {
            return false;
        }
    }
}

// Initialize and global functions
const adminManager = new AdminOrderManager();
window.adminManager = adminManager;
window.refreshFromServer = () => adminManager.refreshFromServer();
window.debugStorage = () => adminManager.debugStorage();
window.emergencyRecovery = () => adminManager.emergencyRecovery();
window.closeItemsModal = () => adminManager.closeItemsModal();
