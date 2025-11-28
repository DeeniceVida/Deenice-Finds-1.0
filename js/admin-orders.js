// =============================================
// ADMIN ORDERS FIXES - ADD TO admin-orders.js
// =============================================

// Fix button functionality
function initializeAdminFixes() {
    console.log('🛠️ Initializing admin fixes...');
    
    // Fix refresh button
    const refreshBtn = document.getElementById('refresh-orders');
    if (refreshBtn) {
        refreshBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🔄 Refresh button clicked');
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '🔄 Refreshing...';
            this.disabled = true;
            
            // Reload orders
            setTimeout(() => {
                if (typeof loadOrders === 'function') {
                    loadOrders();
                } else {
                    window.location.reload();
                }
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1000);
        };
    }
    
    // Fix logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🚪 Logout button clicked');
            
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_authenticated');
                localStorage.removeItem('admin_session');
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        };
    }
    
    // Fix debug button
    const debugBtn = document.getElementById('debug-btn');
    if (debugBtn) {
        debugBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🐛 Debug button clicked');
            debugOrders();
        };
    }
    
    // Fix loading issues
    fixLoadingIssues();
}

// Fix loading issues
function fixLoadingIssues() {
    // Hide loading elements after timeout
    setTimeout(() => {
        const loadingElements = document.querySelectorAll('.loading, .spinner');
        loadingElements.forEach(element => {
            if (element.style.display !== 'none') {
                element.style.display = 'none';
            }
        });
    }, 3000);
}

// Debug function
function debugOrders() {
    const adminOrders = JSON.parse(localStorage.getItem('de_admin_orders_secure_v3') || '[]');
    const clientOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
    
    console.log('🐛 DEBUG INFO:');
    console.log(`Admin orders: ${adminOrders.length}`);
    console.log(`Client orders: ${clientOrders.length}`);
    console.log(`Buy For Me orders: ${adminOrders.filter(order => order.type === 'buy-for-me').length}`);
    
    alert(`Debug Info:\nAdmin Orders: ${adminOrders.length}\nClient Orders: ${clientOrders.length}\nBFM Orders: ${adminOrders.filter(order => order.type === 'buy-for-me').length}`);
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 Admin panel loaded');
    initializeAdminFixes();
});
class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.isLoading = false;
        
        // BULLETPROOF STORAGE KEYS
        this.primaryStorageKey = 'de_admin_orders_secure_v3';
        this.backupStorageKey = 'de_admin_orders_backup_secure_v3';
        this.clientStorageKey = 'de_order_history';
        
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing...');
        
        if (!this.token || !this.isValidToken(this.token)) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        // STEP 1: Setup data protection FIRST
        this.setupDataProtection();
        
        // STEP 2: Load orders IMMEDIATELY
        await this.loadOrdersImmediately();
        
        // STEP 3: Setup UI
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
        this.createItemsModal();
        this.createOrderDetailsModal();
        this.createProgressModal();
        
        // STEP 4: Background sync (don't block UI)
        this.syncWithBackend().catch(console.error);
        
        console.log('✅ AdminOrderManager initialized with', this.orders.length, 'orders');
    }

    // BULLETPROOF ORDER LOADING
    async loadOrdersImmediately() {
        console.log('🚀 Loading orders immediately...');
        
        // METHOD 1: Primary storage (fastest)
        let orders = this.loadFromStorage(this.primaryStorageKey);
        console.log(`📦 Primary storage: ${orders.length} orders`);
        
        // METHOD 2: Backup storage
        if (orders.length === 0) {
            orders = this.loadFromStorage(this.backupStorageKey);
            console.log(`💾 Backup storage: ${orders.length} orders`);
            
            if (orders.length > 0) {
                // Restore to primary
                this.saveToStorage(this.primaryStorageKey, orders);
            }
        }
        
        // METHOD 3: Legacy storage recovery
        if (orders.length === 0) {
            orders = this.recoverFromLegacyStorage();
            console.log(`🔄 Legacy recovery: ${orders.length} orders`);
        }
        
        // METHOD 4: Client storage recovery
        if (orders.length === 0) {
            orders = this.loadFromStorage(this.clientStorageKey);
            console.log(`📱 Client storage: ${orders.length} orders`);
            
            if (orders.length > 0) {
                this.saveToStorage(this.primaryStorageKey, orders);
            }
        }
        
        this.orders = orders;
        
        // Final fallback: Server (async)
        if (this.orders.length === 0) {
            this.attemptServerLoad().catch(console.error);
        }
        
        console.log(`✅ Loaded ${this.orders.length} orders total`);
    }

    // SIMPLE STORAGE METHODS
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            
            const orders = JSON.parse(data);
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error(`❌ Error loading from ${key}:`, error);
            return [];
        }
    }

    saveToStorage(key, orders) {
        try {
            if (!Array.isArray(orders)) {
                console.error('Invalid orders data for storage');
                return false;
            }
            
            localStorage.setItem(key, JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error(`❌ Error saving to ${key}:`, error);
            return false;
        }
    }

    // Save to BOTH primary and backup
    saveOrders(orders) {
        this.orders = orders;
        this.saveToStorage(this.primaryStorageKey, orders);
        this.saveToStorage(this.backupStorageKey, orders);
        console.log(`💾 Saved ${orders.length} orders to secure storage`);
    }

    // BULLETPROOF DATA PROTECTION
    setupDataProtection() {
        console.log('🛡️ Setting up bulletproof data protection...');
        
        // Protect against localStorage.clear()
        const originalClear = localStorage.clear;
        localStorage.clear = () => {
            console.warn('🚨 BLOCKED: localStorage.clear() attempted!');
            this.emergencyBackup();
            this.safeStorageCleanup();
        };

        // Protect against removeItem for order keys
        const originalRemove = localStorage.removeItem;
        localStorage.removeItem = (key) => {
            if (key && (key.includes('order') || key.includes('admin_order'))) {
                console.warn(`🚨 BLOCKED: Attempt to remove order key: ${key}`);
                this.emergencyBackup();
                return;
            }
            originalRemove.call(localStorage, key);
        };

        // Auto-save on changes
        this.setupAutoSave();
        
        // Backup before unload
        window.addEventListener('beforeunload', () => {
            this.emergencyBackup();
        });

        // Periodic backup every 30 seconds
        setInterval(() => {
            this.emergencyBackup();
        }, 30000);

        console.log('✅ Data protection active');
    }

    safeStorageCleanup() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.includes('order') && !key.includes('admin_order') && !key.includes('token')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Safe cleanup: Removed ${keysToRemove.length} non-order items`);
    }

    emergencyBackup() {
        if (this.orders.length > 0) {
            this.saveOrders(this.orders);
            localStorage.setItem('emergency_backup_timestamp', new Date().toISOString());
            console.log('🚨 Emergency backup completed');
        }
    }

    setupAutoSave() {
        // Save after status updates
        const originalUpdate = this.updateStatus;
        this.updateStatus = async (orderId, newStatus) => {
            await originalUpdate.call(this, orderId, newStatus);
            this.saveOrders(this.orders);
        };

        // Save after deletions
        const originalDelete = this.deleteOrder;
        this.deleteOrder = async (orderId) => {
            await originalDelete.call(this, orderId);
            this.saveOrders(this.orders);
        };
    }

    // LEGACY STORAGE RECOVERY
    recoverFromLegacyStorage() {
        const legacyKeys = [
            'de_order_history',
            'de_order_history_backup',
            'de_admin_orders', 
            'de_admin_orders_backup',
            'order_history',
            'deenice_orders',
            'user_orders',
            'de_orders'
        ];
        
        let recoveredOrders = [];
        
        legacyKeys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const orders = JSON.parse(data);
                    if (Array.isArray(orders) && orders.length > 0) {
                        console.log(`🔄 Recovered ${orders.length} orders from ${key}`);
                        
                        // Merge without duplicates
                        orders.forEach(order => {
                            if (order && order.id) {
                                const exists = recoveredOrders.find(o => o.id === order.id);
                                if (!exists) {
                                    recoveredOrders.push(order);
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.log(`No recovery from ${key}`);
            }
        });
        
        if (recoveredOrders.length > 0) {
            this.saveOrders(recoveredOrders);
            this.showNotification(`Recovered ${recoveredOrders.length} orders from legacy storage`, 'success');
        }
        
        return recoveredOrders;
    }

    // SERVER SYNC
    async syncWithBackend() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            console.log('🔄 Syncing with server...');
            const data = await this.makeRequest('/orders');
            
            if (data.orders && Array.isArray(data.orders)) {
                // Merge server data with local
                this.orders = this.mergeOrders(this.orders, data.orders);
                this.saveOrders(this.orders);
                this.renderStats();
                this.renderOrders();
                console.log('✅ Server sync completed');
            }
        } catch (error) {
            console.error('❌ Server sync failed:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async attemptServerLoad() {
        try {
            const data = await this.makeRequest('/orders');
            if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
                this.orders = data.orders;
                this.saveOrders(this.orders);
                this.renderStats();
                this.renderOrders();
                this.showNotification(`Loaded ${data.orders.length} orders from server`, 'success');
            }
        } catch (error) {
            // Silent fail
        }
    }

    mergeOrders(localOrders, serverOrders) {
        const orderMap = new Map();
        
        // Add local orders first
        localOrders.forEach(order => {
            if (order && order.id) orderMap.set(order.id, order);
        });
        
        // Server orders override local ones
        serverOrders.forEach(serverOrder => {
            if (serverOrder && serverOrder.id) {
                orderMap.set(serverOrder.id, serverOrder);
            }
        });
        
        return Array.from(orderMap.values())
            .sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
    }

    // ORDER STATUS MANAGEMENT
    async updateStatus(orderId, newStatus) {
        try {
            console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
            
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }

            const oldStatus = order.status;
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            // Immediate UI update
            this.renderStats();
            this.renderOrders();
            
            // Immediate save
            this.saveOrders(this.orders);
            
            // Sync to client
            this.syncStatusToClient(orderId, newStatus);
            
            // Background server sync
            this.syncStatusToServer(orderId, newStatus).catch(console.error);
            
            this.showNotification(`Order #${orderId} updated from ${oldStatus} to ${newStatus}`, 'success');
            
        } catch (error) {
            console.error('❌ Status update failed:', error);
            this.showNotification('Update failed: ' + error.message, 'error');
        }
    }

    async syncStatusToServer(orderId, newStatus) {
        try {
            await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            console.log('✅ Server status updated');
        } catch (error) {
            console.error('❌ Server status update failed:', error);
        }
    }

    async syncStatusToClient(orderId, newStatus) {
        try {
            const clientOrders = this.loadFromStorage(this.clientStorageKey);
            const orderIndex = clientOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                clientOrders[orderIndex].status = newStatus;
                clientOrders[orderIndex].statusUpdated = new Date().toISOString();
                
                this.saveToStorage(this.clientStorageKey, clientOrders);
                this.saveToStorage('de_order_history_backup', clientOrders);
                
                // Trigger storage event for real-time updates
                window.dispatchEvent(new Event('storage'));
                
                console.log(`✅ Client status updated: ${orderId} -> ${newStatus}`);
            }
        } catch (error) {
            console.error('Error updating client status:', error);
        }
    }

    // ORDER ACTIONS
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
            
            // Update storage
            this.saveOrders(this.orders);
            
            this.showNotification(`Order #${orderId} deleted`, 'success');
            
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    // MANUAL RECOVERY
    manualRecovery() {
        console.log('🚨 Manual recovery triggered');
        
        const recovered = this.recoverFromLegacyStorage();
        if (recovered.length > 0) {
            this.orders = recovered;
            this.saveOrders(this.orders);
            this.renderStats();
            this.renderOrders();
            this.showNotification(`Manual recovery: ${recovered.length} orders restored`, 'success');
        } else {
            this.showNotification('No orders found in recovery', 'error');
        }
    }

    // LOGOUT (PRESERVE DATA)
    logout() {
        console.log('🚪 Admin logout - securing data...');
        
        // Final backup
        this.emergencyBackup();
        
        // Only remove auth data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
        
        console.log('✅ Logout completed - data secured');
        window.location.href = 'admin-login.html';
    }

    // API REQUESTS
    async makeRequest(endpoint, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            };

            if (options.body) {
                config.body = options.body;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            clearTimeout(timeoutId);

            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`❌ API Request Failed:`, error);
            throw error;
        }
    }

    // UI RENDERING
    showLoadingState() {
        const statsGrid = document.getElementById('statsGrid');
        const ordersTable = document.getElementById('ordersTableBody');
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number stat-total">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-pending">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-processing">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-completed">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-cancelled">--</div>
                    <div>Loading...</div>
                </div>
            `;
        }
        
        if (ordersTable) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <div class="loading-spinner"></div>
                            <span>Loading orders...</span>
                        </div>
                    </td>
                </tr>
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
        if (!container) {
            console.error('❌ ordersTableBody container not found!');
            return;
        }

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

        // Check if this is a Buy For Me order
        const isBuyForMe = order.type === 'buy-for-me' || 
                          (order.items && order.items.some(item => item.link)) ||
                          (order.id && order.id.startsWith('BFM'));

        // Get progress data - only for Buy For Me orders
        let progressDisplay = '';
        if (isBuyForMe && window.progressTracker) {
            const progressData = progressTracker.getProgressDataForAdmin(order);
            if (progressData) {
                progressDisplay = `
                    <div class="progress-tracker compact">
                        <div class="progress-bar ${order.status === 'cancelled' ? 'cancelled' : ''}">
                            <div class="progress-fill" style="width: ${progressData.progressPercentage}%"></div>
                        </div>
                        <div class="progress-percentage">
                            ${Math.round(progressData.progressPercentage)}% Complete
                        </div>
                        <small style="display:block; margin-top:5px; color:#666;">
                            ${progressData.currentStep.name}
                        </small>
                    </div>
                    <button class="edit-btn" 
                        onclick="adminManager.openProgressModal('${order.id}', '${status}')"
                        style="margin-top:6px; background: #8EDBD1; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
                        Update Progress
                    </button>
                `;
            }
        } else {
            progressDisplay = '<div class="not-bfm-order">Regular Order</div>';
        }

        return `
            <tr data-order-id="${order.id}">
                <td>
                    <strong>#${order.id}</strong>
                    ${isBuyForMe ? '<span class="bfm-indicator">BFM</span>' : ''}
                </td>

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

                <!-- PROGRESS COLUMN -->
                <td style="min-width: 150px;">
                    ${progressDisplay}
                </td>

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

                        <!-- PRINT BUTTONS -->
                        <button class="print-btn"
                            onclick="adminManager.printShippingLabel('${order.id}')"
                            style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin: 2px; display: block; width: 100%;">
                            🖨️ Print Label
                        </button>

                        <button class="preview-btn"
                            onclick="adminManager.previewShippingLabel('${order.id}')"
                            style="background: #6f42c1; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin: 2px; display: block; width: 100%;">
                            👀 Preview Label
                        </button>

                        <button class="btn-danger"
                            onclick="adminManager.deleteOrder('${order.id}')"
                            style="margin-top: 5px;">
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
        const imageUrl = item.img || item.image || item.thumbnail || 
                        'https://via.placeholder.com/40x40/CCCCCC/666666?text=No+Image';
        const qty = item.qty || 1;
        
        return `
            <div class="order-item-preview">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     class="item-image-small"
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
                <td colspan="8" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="adminManager.manualRecovery()">
                            🚨 Manual Recovery
                        </button>
                        <button class="btn btn-secondary" onclick="adminManager.syncWithBackend()">
                            🔄 Sync Server
                        </button>
                        <button class="btn btn-info" onclick="adminManager.debugStorage()">
                            🔍 Debug Storage
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getNoResultsState() {
        return `
            <tr>
                <td colspan="8" class="empty-state">
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

        // Refresh button
        const refreshBtn = document.querySelector('.btn-primary');
        if (refreshBtn && refreshBtn.textContent.includes('Refresh')) {
            refreshBtn.addEventListener('click', () => {
                this.loadOrdersImmediately().then(() => {
                    this.renderStats();
                    this.renderOrders();
                });
            });
        }

        // Debug button
        const debugBtn = document.querySelector('.btn-secondary');
        if (debugBtn && debugBtn.textContent.includes('Debug')) {
            debugBtn.addEventListener('click', () => {
                this.debugOrders();
            });
        }

        // Bulk print buttons
        const enableBulkBtn = document.querySelector('.enable-bulk-btn');
        if (enableBulkBtn) {
            enableBulkBtn.addEventListener('click', () => {
                this.enableBulkPrintMode();
            });
        }

        const bulkPrintBtn = document.querySelector('.bulk-print-btn');
        if (bulkPrintBtn) {
            bulkPrintBtn.addEventListener('click', () => {
                this.printSelectedOrders();
            });
        }

        const bulkCancelBtn = document.querySelector('.bulk-cancel-btn');
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => {
                this.cancelBulkPrint();
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

    // PROGRESS MODAL FUNCTIONS
    createProgressModal() {
        if (document.getElementById('progressModal')) return;

        const modalHTML = `
            <div id="progressModal" class="modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;" id="progressModalTitle">Update Order Progress</h3>
                        <button onclick="adminManager.closeProgressModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5em;
                            cursor: pointer;
                            color: #666;
                            padding: 5px;
                        ">×</button>
                    </div>
                    <div id="progressModalContent">
                        <!-- Progress options will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    openProgressModal(orderId, currentStatus) {
        const order = this.orders.find(o => o.id === orderId);
        const isBuyForMe = order && (order.type === 'buy-for-me' || 
                                    (order.items && order.items.some(item => item.link)) ||
                                    (order.id && order.id.startsWith('BFM')));
        
        if (!isBuyForMe) {
            this.showNotification('This is not a Buy For Me order', 'error');
            return;
        }

        const modal = document.getElementById('progressModal');
        const content = document.getElementById('progressModalContent');
        
        const steps = [
            { id: 'ordered', name: 'Ordered', status: 'pending' },
            { id: 'preparing', name: 'Preparing', status: 'processing' },
            { id: 'shipped', name: 'Shipped', status: 'shipped' },
            { id: 'delivered', name: 'Delivered', status: 'completed' }
        ];
        
        const currentStepIndex = window.progressTracker ? 
            window.progressTracker.getCurrentStepIndex(currentStatus) : 0;
        
        content.innerHTML = `
            <p>Update progress for <strong>Buy For Me Order #${orderId}</strong>:</p>
            <div class="progress-options">
                ${steps.map((step, index) => {
                    const isSelected = index === currentStepIndex;
                    
                    return `
                        <div class="progress-step-option ${isSelected ? 'selected' : ''}" 
                             onclick="adminManager.selectProgressStep('${orderId}', '${step.status}')">
                            <div class="step-name">${step.name}</div>
                            <div class="step-description">Update order to ${step.name} stage</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-danger" onclick="adminManager.cancelOrder('${orderId}')" style="margin-top: 10px;">
                    ❌ Cancel Order
                </button>
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    selectProgressStep(orderId, newStatus) {
        this.updateStatus(orderId, newStatus);
        this.closeProgressModal();
    }

    cancelOrder(orderId) {
        if (confirm('Are you sure you want to cancel this Buy For Me order?')) {
            this.updateStatus(orderId, 'cancelled');
            this.closeProgressModal();
        }
    }

    closeProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // BULK PRINT FUNCTIONS
    enableBulkPrintMode() {
        console.log('📋 Enabling bulk print mode');
        this.showNotification('Bulk print mode enabled - feature coming soon!', 'info');
    }

    printSelectedOrders() {
        console.log('🖨️ Printing selected orders');
        this.showNotification('Printing selected orders - feature coming soon!', 'info');
    }

    cancelBulkPrint() {
        console.log('❌ Cancelling bulk print');
        this.showNotification('Bulk print cancelled', 'info');
    }

    // ORDER DETAILS MODAL
    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const customerName = order.customer?.name || order.name || 'N/A';
            const customerCity = order.customer?.city || order.city || 'N/A';
            const customerPhone = order.customer?.phone || order.phone || 'Not provided';
            const customerEmail = order.customer?.email || order.email || 'Not provided';
            
            const orderDate = new Date(order.orderDate || order.date).toLocaleString();
            const statusUpdated = order.statusUpdated ? new Date(order.statusUpdated).toLocaleString() : 'N/A';
            const totalAmount = order.totalAmount || order.total || 0;
            const currency = order.currency || 'KES';
            
            const deliveryMethod = order.delivery?.method || 'Home Delivery';
            const pickupCode = order.delivery?.pickupCode || 'N/A';
            const deliveryAddress = order.delivery?.address || 'Not specified';
            
            const items = order.items || [];
            
            let details = `
ORDER #${order.id} - DETAILS

📋 CUSTOMER INFORMATION:
├── Name: ${customerName}
├── City: ${customerCity}
├── Phone: ${customerPhone}
└── Email: ${customerEmail}

📦 ORDER INFORMATION:
├── Status: ${order.status.toUpperCase()}
├── Order Date: ${orderDate}
├── Last Updated: ${statusUpdated}
├── Total: ${currency} ${totalAmount.toLocaleString()}
└── Delivery: ${deliveryMethod}
   ${deliveryMethod === 'pickup' ? `├── Pickup Code: ${pickupCode}` : `├── Address: ${deliveryAddress}`}

🛍️ ITEMS (${items.length}):
`;

            if (items.length > 0) {
                items.forEach((item, index) => {
                    const itemName = item.title || item.name || 'Unknown Item';
                    const itemPrice = item.price || 0;
                    const itemQty = item.qty || 1;
                    const itemTotal = itemPrice * itemQty;
                    const itemCurrency = item.currency || 'KES';
                    
                    details += `\n${index + 1}. ${itemName}
   ├── Quantity: ${itemQty}
   ├── Price: ${itemCurrency} ${itemPrice.toLocaleString()}
   └── Total: ${itemCurrency} ${itemTotal.toLocaleString()}`;
                    
                    if (item.color) details += `\n   ├── Color: ${item.color}`;
                    if (item.model) details += `\n   ├── Model: ${item.model}`;
                    if (item.size) details += `\n   ├── Size: ${item.size}`;
                });
                
                const subtotal = items.reduce((sum, item) => {
                    return sum + ((item.price || 0) * (item.qty || 1));
                }, 0);
                
                details += `\n\n💰 ORDER SUMMARY:
├── Subtotal: ${currency} ${subtotal.toLocaleString()}
├── Delivery: ${currency} 0
└── TOTAL: ${currency} ${totalAmount.toLocaleString()}`;
                
            } else {
                details += '\nNo items in this order';
            }

            this.showOrderDetailsModal(details, orderId);
        } else {
            alert(`Order #${orderId} not found!`);
        }
    }

    createOrderDetailsModal() {
        if (document.getElementById('orderDetailsModal')) return;

        const modalHTML = `
            <div id="orderDetailsModal" class="modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;" id="orderDetailsTitle">Order Details</h3>
                        <button onclick="adminManager.closeOrderDetailsModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5em;
                            cursor: pointer;
                            color: #666;
                            padding: 5px;
                        ">×</button>
                    </div>
                    <pre style="
                        white-space: pre-wrap;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        line-height: 1.4;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        overflow-x: auto;
                    " id="orderDetailsContent"></pre>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="adminManager.closeOrderDetailsModal()" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showOrderDetailsModal(details, orderId) {
        const modal = document.getElementById('orderDetailsModal');
        const title = document.getElementById('orderDetailsTitle');
        const content = document.getElementById('orderDetailsContent');
        
        if (modal && title && content) {
            title.textContent = `Order #${orderId} Details`;
            content.textContent = details;
            modal.style.display = 'flex';
        }
    }

    closeOrderDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // ITEMS MODAL
    viewOrderItems(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const items = order.items || [];
        const modalContent = document.getElementById('itemsModalContent');
        
        if (!modalContent) {
            console.error('❌ Items modal content not found');
            return;
        }

        if (items.length === 0) {
            modalContent.innerHTML = '<p>No items in this order.</p>';
        } else {
            modalContent.innerHTML = items.map((item, index) => {
                const title = item.title || item.name || 'Unknown Item';
                const imageUrl = item.img || item.image || item.thumbnail || 
                               'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';
                const price = item.price || 0;
                const qty = item.qty || 1;
                const total = price * qty;
                const currency = item.currency || 'KES';
                
                return `
                    <div class="order-item-modal" style="
                        display: flex;
                        gap: 15px;
                        padding: 15px;
                        border: 1px solid #e5e5e7;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        background: #f8f9fa;
                    ">
                        <img src="${imageUrl}" 
                             alt="${title}"
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;"
                             onerror="this.src='https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image'">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                            <div style="font-size: 0.9em; color: #666;">
                                <div>Quantity: ${qty}</div>
                                <div>Price: ${currency} ${price.toLocaleString()}</div>
                                <div style="font-weight: bold; color: #333;">Total: ${currency} ${total.toLocaleString()}</div>
                                ${item.color ? `<div>Color: ${item.color}</div>` : ''}
                                ${item.size ? `<div>Size: ${item.size}</div>` : ''}
                                ${item.model ? `<div>Model: ${item.model}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const modal = document.getElementById('itemsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    createItemsModal() {
        if (document.getElementById('itemsModal')) return;

        const modalHTML = `
            <div id="itemsModal" class="modal" style="display: none;">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    margin: 50px auto;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Order Items</h3>
                        <button onclick="adminManager.closeItemsModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5em;
                            cursor: pointer;
                            color: #666;
                            padding: 5px;
                        ">×</button>
                    </div>
                    <div id="itemsModalContent"></div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button onclick="adminManager.closeItemsModal()" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeItemsModal() {
        const modal = document.getElementById('itemsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // CUSTOMER CONTACT
    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const phone = order.customer?.phone || order.phone || order.customer?.mobile || order.mobile;
            const customerName = order.customer?.name || order.name || 'there';
            
            if (phone) {
                const cleanPhone = phone.replace(/\D/g, '');
                
                if (cleanPhone.length >= 9) {
                    const message = `Hello ${customerName}, this is Deenice Finds regarding your order #${orderId}. How can we assist you today?`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
                    
                    this.openWhatsAppURL(whatsappURL);
                } else {
                    alert(`Phone number for order #${orderId} appears invalid: ${phone}`);
                }
            } else {
                alert(`No valid phone number found for order #${orderId}\n\nCustomer: ${customerName}`);
            }
        } else {
            alert(`Order #${orderId} not found!`);
        }
    }

    openWhatsAppURL(url) {
        try {
            const newWindow = window.open(url, '_blank');
            if (!newWindow || newWindow.closed) {
                window.location.href = url;
            }
        } catch (error) {
            const manualSend = confirm("WhatsApp didn't open automatically. Click OK to copy the link.");
            if (manualSend) {
                navigator.clipboard.writeText(url).then(() => {
                    alert("WhatsApp link copied! Please paste it in your browser.");
                }).catch(() => {
                    prompt("Copy this WhatsApp link:", url);
                });
            }
        }
    }

    // LABEL PRINTING
    printShippingLabel(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            if (typeof labelPrinter !== 'undefined') {
                labelPrinter.printLabel(order);
                this.showNotification(`Opening print dialog for order #${orderId}`, 'success');
            } else {
                this.showNotification('Label printer not loaded.', 'error');
            }
        } else {
            this.showNotification(`Order #${orderId} not found!`, 'error');
        }
    }

    previewShippingLabel(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            if (typeof labelPrinter !== 'undefined') {
                labelPrinter.previewLabel(order);
            } else {
                this.showNotification('Label printer not loaded.', 'error');
            }
        } else {
            this.showNotification(`Order #${orderId} not found!`, 'error');
        }
    }

    // DEBUG & UTILITY
    debugStorage() {
        const primary = this.loadFromStorage(this.primaryStorageKey);
        const backup = this.loadFromStorage(this.backupStorageKey);
        const client = this.loadFromStorage(this.clientStorageKey);
        
        const debugInfo = `
🔍 STORAGE DEBUG:
Primary: ${primary.length} orders
Backup: ${backup.length} orders  
Client: ${client.length} orders
Memory: ${this.orders.length} orders

🆔 Primary Order IDs: ${primary.map(o => o.id).join(', ') || 'None'}
🆔 Memory Order IDs: ${this.orders.map(o => o.id).join(', ') || 'None'}
        `.trim();

        console.log(debugInfo);
        alert(debugInfo);
    }

    debugOrders() {
        console.log('🐛 Debug Info:', {
            totalOrders: this.orders.length,
            orders: this.orders,
            localStorage: JSON.parse(localStorage.getItem('de_order_history') || '[]').length,
            currentFilter: this.currentFilter
        });
        
        alert(`Debug Info:\nTotal Orders: ${this.orders.length}\nCheck console for details.`);
    }

    // NOTIFICATION SYSTEM
    showNotification(message, type = 'info') {
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

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
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

// Initialize the admin manager
const adminManager = new AdminOrderManager();

// Global functions
window.adminManager = adminManager;
window.manualRecovery = () => adminManager.manualRecovery();
window.debugStorage = () => adminManager.debugStorage();
window.syncWithBackend = () => adminManager.syncWithBackend();
window.closeItemsModal = () => adminManager.closeItemsModal();
window.closeOrderDetailsModal = () => adminManager.closeOrderDetailsModal();
window.closeProgressModal = () => adminManager.closeProgressModal();

// Close modal when clicking outside
window.onclick = function(event) {
    const progressModal = document.getElementById('progressModal');
    if (event.target === progressModal) {
        adminManager.closeProgressModal();
    }
    
    const itemsModal = document.getElementById('itemsModal');
    if (event.target === itemsModal) {
        adminManager.closeItemsModal();
    }
    
    const orderDetailsModal = document.getElementById('orderDetailsModal');
    if (event.target === orderDetailsModal) {
        adminManager.closeOrderDetailsModal();
    }
};
