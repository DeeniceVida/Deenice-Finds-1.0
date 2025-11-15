// js/order-sync.js - ENHANCED Real-time Order Synchronization
class OrderSyncManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.syncInterval = 15000; // Reduced to 15 seconds for better responsiveness
        this.lastSyncTime = null;
        this.init();
    }

    init() {
        console.log('🔄 Enhanced OrderSyncManager initializing...');
        this.startSync();
        this.setupEventListeners();
        this.setupSyncMonitoring();
    }

    // NEW: Setup monitoring for admin changes
    setupSyncMonitoring() {
        // Monitor for admin sync events
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_sync_events') {
                console.log('📢 Sync event detected, forcing immediate sync');
                this.forceSync();
            }
            
            if (e.key === 'de_order_sync_markers') {
                console.log('🔄 Order sync marker updated');
                this.checkOrderUpdates();
            }
        });

        // Monitor for custom events
        window.addEventListener('de_order_history_updated', (e) => {
            console.log('🔄 Custom order update event received');
            this.forceSync();
        });
    }

    // NEW: Check for specific order updates
    async checkOrderUpdates() {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            const orderIds = Object.keys(markers);
            
            if (orderIds.length > 0) {
                console.log('🔍 Checking updates for orders:', orderIds);
                await this.syncOrders();
                
                // Clear markers after successful sync
                localStorage.removeItem('de_order_sync_markers');
            }
        } catch (error) {
            console.error('Error checking order updates:', error);
        }
    }

    // ENHANCED sync method
    async syncOrders() {
        try {
            console.log('🔄 Enhanced order sync starting...');
            
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            console.log('📋 Local orders before sync:', localOrders.length);

            // Get server orders using the user endpoint
            const response = await fetch(`${this.baseURL}/orders/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    localOrders: localOrders,
                    lastSync: this.lastSyncTime
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const serverData = await response.json();
            const serverOrders = serverData.orders || [];
            console.log('📡 Server orders received:', serverOrders.length);

            // Enhanced merge with priority to server data
            const mergedOrders = this.enhancedMergeOrders(localOrders, serverOrders);
            
            // Update localStorage
            localStorage.setItem('de_order_history', JSON.stringify(mergedOrders));
            localStorage.setItem('last_sync', new Date().toISOString());
            this.lastSyncTime = new Date().toISOString();

            console.log('✅ Sync completed. Final order count:', mergedOrders.length);

            // Enhanced UI update
            this.updateOrderHistoryUI(mergedOrders);

            return mergedOrders;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.handleSyncError(error);
            return JSON.parse(localStorage.getItem('de_order_history') || '[]');
        }
    }

    // ENHANCED merge with server priority
    enhancedMergeOrders(localOrders, serverOrders) {
        const orderMap = new Map();
        
        // Add all local orders first
        localOrders.forEach(order => {
            orderMap.set(order.id, { ...order, source: 'local' });
        });
        
        // Update with server orders (server wins conflicts)
        serverOrders.forEach(serverOrder => {
            const existingOrder = orderMap.get(serverOrder.id);
            
            if (existingOrder) {
                // Server data takes precedence
                orderMap.set(serverOrder.id, {
                    ...existingOrder,
                    ...serverOrder,
                    source: 'server'
                });
                console.log('🔄 Updated order from server:', serverOrder.id, serverOrder.status);
            } else {
                // New order from server
                orderMap.set(serverOrder.id, {
                    ...serverOrder,
                    source: 'server'
                });
                console.log('➕ Added new order from server:', serverOrder.id);
            }
        });

        const mergedOrders = Array.from(orderMap.values());
        
        // Sort by date (newest first)
        return mergedOrders.sort((a, b) => 
            new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date)
        );
    }

    // ENHANCED UI update method
    updateOrderHistoryUI(orders) {
        if (typeof orderHistory !== 'undefined') {
            console.log('🎨 Updating order history UI...');
            orderHistory.orders = orders;
            orderHistory.renderOrders();
            
            // Show sync notification
            this.showSyncNotification('Orders updated successfully!');
        } else {
            console.log('ℹ️ Order history not initialized on this page');
        }
    }

    // NEW: Show sync notification
    showSyncNotification(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #8EDBD1;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ENHANCED error handling
    handleSyncError(error) {
        console.error('Sync error handled:', error);
        
        if (navigator.onLine) {
            this.showSyncNotification('Sync failed. Using local data.');
        } else {
            this.showSyncNotification('Offline. Using local data.');
        }
    }

    startSync() {
        // Initial sync
        setTimeout(() => this.syncOrders(), 1000);
        
        // Periodic sync - more frequent for better responsiveness
        setInterval(() => {
            if (navigator.onLine) {
                this.syncOrders();
            }
        }, this.syncInterval);

        // Sync when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                console.log('📱 Page visible, syncing...');
                this.syncOrders();
            }
        });

        // Sync when coming online
        window.addEventListener('online', () => {
            console.log('🌐 Online, syncing...');
            this.syncOrders();
        });
    }

    setupEventListeners() {
        // Listen for manual refresh triggers
        window.addEventListener('manualRefresh', () => {
            this.forceSync();
        });

        // Listen for admin updates
        window.addEventListener('adminOrderUpdate', (e) => {
            console.log('👑 Admin update received:', e.detail);
            this.forceSync();
        });
    }

    // ENHANCED force sync with retry
    async forceSync() {
        console.log('🔄 Manual force sync triggered');
        try {
            await this.syncOrders();
            this.showSyncNotification('Orders refreshed!');
        } catch (error) {
            console.error('Force sync failed:', error);
            this.showSyncNotification('Refresh failed. Please try again.');
        }
    }
}

// Initialize enhanced sync manager
const orderSync = new OrderSyncManager();
window.orderSync = orderSync;

// Auto-initialize if on order history page
if (document.querySelector('.order-history-page')) {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.orderSync) {
            window.orderSync = new OrderSyncManager();
        }
    });
}
// Add to OrderSyncManager class
setupPersistentStorage() {
    // Create a backup in more persistent storage
    if (!localStorage.getItem('de_order_history_backup')) {
        const currentOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        localStorage.setItem('de_order_history_backup', JSON.stringify(currentOrders));
    }
    
    // Restore from backup if main storage is empty
    window.addEventListener('storage', (e) => {
        if (e.key === 'de_order_history' && (!e.newValue || e.newValue === '[]')) {
            const backup = localStorage.getItem('de_order_history_backup');
            if (backup && backup !== '[]') {
                localStorage.setItem('de_order_history', backup);
                console.log('🔄 Restored orders from backup');
            }
        }
    });
    
    // Auto-backup every 5 minutes
    setInterval(() => {
        const orders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        if (orders.length > 0) {
            localStorage.setItem('de_order_history_backup', JSON.stringify(orders));
        }
    }, 300000);
}

// Call this in init()
init() {
    console.log('🔄 Enhanced OrderSyncManager initializing...');
    this.setupPersistentStorage(); // ADD THIS LINE
    this.startSync();
    this.setupEventListeners();
    this.setupSyncMonitoring();
}
