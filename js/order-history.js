// js/order-history.js - WITH PERMANENT STORAGE
class OrderHistory {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.storageManager = window.orderStorage;
        this.init();
    }

    async init() {
        console.log('📦 OrderHistory initializing with permanent storage...');
        await this.loadOrders();
        this.renderOrders();
        this.setupEventListeners();
        this.setupStorageListeners();
        this.setupAdminUpdateListener();
        
        console.log(`✅ OrderHistory initialized with ${this.orders.length} orders`);
    }

    // ENHANCED: Load orders with permanent storage
    async loadOrders() {
        try {
            console.log('📥 Loading orders from permanent storage...');
            
            // Use the storage manager
            this.orders = this.storageManager.getOrders();
            
            console.log(`✅ Loaded ${this.orders.length} orders from storage`);

            // Sort orders by date (newest first)
            this.orders.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
            
            // If no orders, try to sync
            if (this.orders.length === 0 && navigator.onLine) {
                console.log('🔄 No local orders, attempting sync...');
                await this.attemptSync();
            }
            
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.orders = [];
        }
    }

    // Attempt to sync with server
    async attemptSync() {
        if (window.orderSync) {
            try {
                await window.orderSync.syncOrders();
                // Reload from storage after sync
                this.orders = this.storageManager.getOrders();
            } catch (error) {
                console.error('Sync failed:', error);
            }
        }
    }

    // Save orders to permanent storage
    saveOrders() {
        const success = this.storageManager.saveOrders(this.orders);
        if (success) {
            console.log(`💾 Orders saved to permanent storage: ${this.orders.length}`);
        } else {
            console.error('❌ Failed to save orders');
        }
        return success;
    }

    // Setup storage event listeners
    setupStorageListeners() {
        // Listen for storage updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_order_history') {
                console.log('💾 Storage update detected, reloading orders...');
                this.loadOrders().then(() => this.renderOrders());
            }
        });

        // Listen for custom storage events
        window.addEventListener('orderStorageUpdated', (e) => {
            console.log('🔄 Order storage updated, refreshing...');
            this.orders = e.detail.orders || [];
            this.renderOrders();
        });

        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('📱 Page visible, checking for updates...');
                this.loadOrders().then(() => this.renderOrders());
            }
        });
    }

    // Setup admin update listener
    setupAdminUpdateListener() {
        window.addEventListener('adminOrderUpdate', (e) => {
            console.log('📢 Admin update received:', e.detail);
            this.handleAdminUpdate(e.detail);
        });
    }

    // Handle admin updates
    handleAdminUpdate(updateDetail) {
        const { orderId, newStatus } = updateDetail;
        console.log(`🔄 Processing admin update: ${orderId} -> ${newStatus}`);
        
        // Update local order
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex > -1) {
            this.orders[orderIndex].status = newStatus;
            this.orders[orderIndex].statusUpdated = new Date().toISOString();
            
            // Save to permanent storage
            this.saveOrders();
            
            // Update UI
            this.renderOrders();
            
            // Highlight updated order
            this.highlightUpdatedOrder(orderId, newStatus);
            
            console.log(`✅ Updated order ${orderId} to ${newStatus}`);
        } else {
            // Order not found, reload from storage
            console.log(`⚠️ Order ${orderId} not found, reloading...`);
            this.loadOrders().then(() => this.renderOrders());
        }
    }

    // Highlight updated order
    highlightUpdatedOrder(orderId, newStatus) {
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            orderCard.style.transition = 'all 0.5s ease';
            orderCard.style.backgroundColor = '#f0f8ff';
            
            setTimeout(() => {
                orderCard.style.backgroundColor = '';
            }, 2000);
        }
    }

    // Add new order
    addOrder(orderData) {
        const newOrder = {
            id: orderData.id || 'DF' + Date.now().toString(36).toUpperCase(),
            orderDate: new Date().toISOString(),
            status: 'pending',
            statusUpdated: new Date().toISOString(),
            ...orderData
        };

        this.orders.unshift(newOrder);
        this.saveOrders();
        this.renderOrders();
        
        console.log(`✅ Added new order: ${newOrder.id}`);
        return newOrder.id;
    }

    // Update order status
    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            this.saveOrders();
            this.renderOrders();
            
            console.log(`✅ Updated order ${orderId} to ${newStatus}`);
            return true;
        }
        return false;
    }

    // Get order by ID
    getOrder(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    // Get orders by status
    getOrdersByStatus(status) {
        if (status === 'all') return this.orders;
        return this.orders.filter(order => order.status === status);
    }

    // Manual refresh
    async manualRefresh() {
        console.log('🔄 Manual refresh triggered');
        try {
            await this.loadOrders();
            this.renderOrders();
            
            if (window.orderSync) {
                await window.orderSync.forceSync();
            }
            
            this.showNotification('Orders refreshed successfully!', 'success');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showNotification('Refresh failed. Please try again.', 'error');
        }
    }

    // Emergency recovery
    emergencyRecovery() {
        console.log('🚨 Manual emergency recovery triggered');
        const recovered = this.storageManager.emergencyRecovery();
        
        if (recovered) {
            this.loadOrders().then(() => {
                this.renderOrders();
                this.showNotification('Orders recovered from backup!', 'success');
            });
        } else {
            this.showNotification('No backup available for recovery.', 'error');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ... (keep your existing render methods, filter methods, etc.)

    renderOrders() {
        const container = document.getElementById('orders-container');
        if (!container) {
            console.log('ℹ️ Orders container not found on this page');
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

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        // Your existing order card creation code
        // Make sure it includes data-order-id attribute
        return `
            <div class="order-card" data-order-id="${order.id}">
                <!-- Your existing order card HTML -->
            </div>
        `;
    }

    filterOrders() {
        if (this.currentFilter === 'all') return this.orders;
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <h3>No orders yet</h3>
                <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
                <a href="index.html" class="btn btn-primary">Start Shopping</a>
                <button class="btn btn-secondary" onclick="orderHistory.emergencyRecovery()" style="margin-top: 10px;">
                    🔄 Try Emergency Recovery
                </button>
            </div>
        `;
    }

    getNoResultsState() {
        return `
            <div class="empty-state">
                <h3>No orders match this filter</h3>
                <p>Try selecting a different filter.</p>
                <button class="btn btn-primary" onclick="orderHistory.setFilter('all')">
                    Show All Orders
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Manual refresh button
        const refreshBtn = document.querySelector('.manual-refresh') || 
                          document.querySelector('[onclick*="manualRefresh"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.manualRefresh();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderOrders();
    }
}

// Initialize order history
const orderHistory = new OrderHistory();

// Global functions
window.addOrderToHistory = function(orderData) {
    return orderHistory.addOrder(orderData);
};

window.getOrderHistory = function() {
    return orderHistory.orders;
};

window.refreshOrderHistory = function() {
    return orderHistory.manualRefresh();
};

window.emergencyOrderRecovery = function() {
    return orderHistory.emergencyRecovery();
};
