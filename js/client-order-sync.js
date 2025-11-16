// js/client-order-sync.js - CLIENT ORDER HISTORY SYNC
class ClientOrderSync {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.storageKey = 'de_order_history';
        this.backupKey = 'de_order_history_backup';
        this.syncKey = 'de_last_sync_time';
        this.init();
    }

    async init() {
        console.log('🔄 ClientOrderSync initializing...');
        
        // Setup storage first
        this.setupPermanentStorage();
        
        // Load existing orders immediately
        this.loadLocalOrders();
        
        // Setup auto-sync
        this.startAutoSync();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ ClientOrderSync initialized');
    }

    // Setup permanent storage with multiple backups
    setupPermanentStorage() {
        // Create backup if doesn't exist
        if (!localStorage.getItem(this.backupKey)) {
            const currentOrders = this.getLocalOrders();
            localStorage.setItem(this.backupKey, JSON.stringify(currentOrders));
        }

        // Auto-backup every 2 minutes
        setInterval(() => {
            this.createBackup();
        }, 120000);

        // Backup before page unload
        window.addEventListener('beforeunload', () => {
            this.createBackup();
        });
    }

    // Load orders from local storage
    loadLocalOrders() {
        const orders = this.getLocalOrders();
        console.log(`📥 Loaded ${orders.length} orders from local storage`);
        this.updateOrderHistoryUI(orders);
        return orders;
    }

    // Get orders from local storage
    getLocalOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Error reading local orders:', error);
            return [];
        }
    }

    // Save orders to local storage
    saveLocalOrders(orders) {
        try {
            if (!Array.isArray(orders)) {
                console.error('Invalid orders data:', orders);
                return false;
            }

            localStorage.setItem(this.storageKey, JSON.stringify(orders));
            localStorage.setItem(this.backupKey, JSON.stringify(orders));
            
            console.log(`💾 Saved ${orders.length} orders to local storage`);
            return true;
        } catch (error) {
            console.error('Error saving orders:', error);
            return false;
        }
    }

    // Create backup
    createBackup() {
        const orders = this.getLocalOrders();
        if (orders.length > 0) {
            localStorage.setItem(this.backupKey, JSON.stringify(orders));
        }
    }

    // Start auto-sync
    startAutoSync() {
        // Initial sync after 2 seconds
        setTimeout(() => {
            this.syncWithServer();
        }, 2000);

        // Sync every 30 seconds
        setInterval(() => {
            if (navigator.onLine) {
                this.syncWithServer();
            }
        }, 30000);

        // Sync when coming online
        window.addEventListener('online', () => {
            console.log('🌐 Online, syncing orders...');
            this.syncWithServer();
        });

        // Sync when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                console.log('📱 Page visible, syncing orders...');
                this.syncWithServer();
            }
        });
    }

    // Sync with server
    async syncWithServer() {
        try {
            console.log('🔄 Syncing orders with server...');
            
            const localOrders = this.getLocalOrders();
            const lastSync = localStorage.getItem(this.syncKey);
            
            const response = await fetch(`${this.baseURL}/orders/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    localOrders: localOrders,
                    lastSync: lastSync
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const serverOrders = data.orders || [];
            
            console.log(`📡 Received ${serverOrders.length} orders from server`);

            // Merge orders (server data takes priority)
            const mergedOrders = this.mergeOrders(localOrders, serverOrders);
            
            // Save merged orders
            this.saveLocalOrders(mergedOrders);
            
            // Update last sync time
            localStorage.setItem(this.syncKey, new Date().toISOString());
            
            // Update UI
            this.updateOrderHistoryUI(mergedOrders);
            
            console.log(`✅ Sync completed. Total orders: ${mergedOrders.length}`);
            
            return mergedOrders;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            // Don't show error if we have local data
            const localOrders = this.getLocalOrders();
            if (localOrders.length === 0) {
                this.showNotification('Unable to load orders. Please check your connection.', 'error');
            }
            return localOrders;
        }
    }

    // Merge local and server orders
    mergeOrders(localOrders, serverOrders) {
        const orderMap = new Map();
        
        // Add all local orders first
        localOrders.forEach(order => {
            if (order && order.id) {
                orderMap.set(order.id, { ...order, source: 'local' });
            }
        });
        
        // Update with server orders (server wins conflicts)
        serverOrders.forEach(serverOrder => {
            if (serverOrder && serverOrder.id) {
                const existingOrder = orderMap.get(serverOrder.id);
                
                if (existingOrder) {
                    // Merge with server data taking priority
                    orderMap.set(serverOrder.id, {
                        ...existingOrder,
                        ...serverOrder,
                        source: 'server'
                    });
                } else {
                    // New order from server
                    orderMap.set(serverOrder.id, {
                        ...serverOrder,
                        source: 'server'
                    });
                }
            }
        });

        const mergedOrders = Array.from(orderMap.values())
            .filter(order => order && order.id) // Filter out invalid orders
            .sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));

        return mergedOrders;
    }

    // Update order history UI
    updateOrderHistoryUI(orders) {
        // Update global orderHistory if it exists
        if (typeof orderHistory !== 'undefined' && orderHistory.orders) {
            orderHistory.orders = orders;
            orderHistory.renderOrders();
        }
        
        // Dispatch custom event for other components
        const event = new CustomEvent('orderHistoryUpdated', {
            detail: { orders: orders }
        });
        window.dispatchEvent(event);
        
        console.log(`🎨 Updated UI with ${orders.length} orders`);
    }

    // Add new order
    addNewOrder(orderData) {
        const newOrder = {
            id: orderData.id || 'DF' + Date.now().toString(36).toUpperCase(),
            orderDate: new Date().toISOString(),
            status: 'pending',
            statusUpdated: new Date().toISOString(),
            ...orderData
        };

        const currentOrders = this.getLocalOrders();
        currentOrders.unshift(newOrder);
        this.saveLocalOrders(currentOrders);
        this.updateOrderHistoryUI(currentOrders);
        
        console.log(`✅ Added new order: ${newOrder.id}`);
        return newOrder.id;
    }

    // Manual refresh
    async manualRefresh() {
        console.log('🔄 Manual refresh triggered');
        try {
            const orders = await this.syncWithServer();
            this.showNotification(`Orders refreshed! ${orders.length} orders loaded.`, 'success');
            return orders;
        } catch (error) {
            console.error('Manual refresh failed:', error);
            this.showNotification('Refresh failed. Using local data.', 'error');
            return this.getLocalOrders();
        }
    }

    // Emergency recovery from backup
    emergencyRecovery() {
        console.log('🚨 Emergency recovery triggered');
        
        const backupOrders = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
        const currentOrders = this.getLocalOrders();
        
        if (backupOrders.length > 0 && backupOrders.length >= currentOrders.length) {
            this.saveLocalOrders(backupOrders);
            this.updateOrderHistoryUI(backupOrders);
            this.showNotification(`Recovered ${backupOrders.length} orders from backup!`, 'success');
            return true;
        } else {
            this.showNotification('No backup available for recovery.', 'error');
            return false;
        }
    }

    // Clear all orders (debugging)
    clearAllOrders() {
        if (confirm('Are you sure you want to clear all order history? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);
            localStorage.removeItem(this.syncKey);
            this.updateOrderHistoryUI([]);
            console.log('🧹 All orders cleared');
            this.showNotification('All orders cleared.', 'info');
        }
    }

    // Get storage stats
    getStorageStats() {
        const orders = this.getLocalOrders();
        const backup = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
        const lastSync = localStorage.getItem(this.syncKey);
        
        return {
            ordersCount: orders.length,
            backupCount: backup.length,
            lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
            storageSize: JSON.stringify(orders).length
        };
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for new orders from other pages
        window.addEventListener('newOrderCreated', (e) => {
            if (e.detail && e.detail.order) {
                this.addNewOrder(e.detail.order);
            }
        });

        // Listen for admin updates
        window.addEventListener('adminOrderUpdate', (e) => {
            if (e.detail && e.detail.orderId && e.detail.newStatus) {
                this.handleAdminUpdate(e.detail);
            }
        });

        // Listen for storage events (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                console.log('💾 Cross-tab storage update detected');
                setTimeout(() => {
                    this.loadLocalOrders();
                }, 100);
            }
        });
    }

    // Handle admin status updates
    handleAdminUpdate(updateDetail) {
        const { orderId, newStatus } = updateDetail;
        const orders = this.getLocalOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex > -1) {
            orders[orderIndex].status = newStatus;
            orders[orderIndex].statusUpdated = new Date().toISOString();
            
            this.saveLocalOrders(orders);
            this.updateOrderHistoryUI(orders);
            
            console.log(`✅ Updated order ${orderId} to ${newStatus}`);
            this.showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.client-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `client-notification ${type}`;
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
        }, 4000);
    }
}

// Initialize global client order sync
const clientOrderSync = new ClientOrderSync();
window.clientOrderSync = clientOrderSync;
