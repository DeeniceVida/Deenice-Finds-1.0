// js/order-sync.js - Real-time Order Synchronization
class OrderSyncManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.syncInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        console.log('🔄 OrderSyncManager initializing...');
        this.startSync();
        this.setupEventListeners();
    }

    // Sync orders between server and localStorage
    async syncOrders() {
        try {
            console.log('🔄 Syncing orders with server...');
            
            // Get current localStorage orders
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            
            // Get orders from server for this user
            const response = await fetch(`${this.baseURL}/orders/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    localOrders: localOrders
                })
            });

            if (response.ok) {
                const serverData = await response.json();
                const serverOrders = serverData.orders || [];
                
                console.log('📊 Sync results:', {
                    local: localOrders.length,
                    server: serverOrders.length
                });

                // Merge server orders with local orders
                const mergedOrders = this.mergeOrders(localOrders, serverOrders);
                
                // Update localStorage with merged data
                localStorage.setItem('de_order_history', JSON.stringify(mergedOrders));
                localStorage.setItem('last_sync', new Date().toISOString());
                
                console.log('✅ Orders synced successfully:', mergedOrders.length);
                
                // Trigger update if on order history page
                if (typeof orderHistory !== 'undefined') {
                    console.log('🔄 Refreshing order history display...');
                    orderHistory.orders = mergedOrders;
                    orderHistory.renderOrders();
                }
                
                return mergedOrders;
            } else {
                console.log('⚠️ Sync failed, using local data');
                return localOrders;
            }
        } catch (error) {
            console.error('❌ Sync failed:', error);
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            return localOrders;
        }
    }

    mergeOrders(localOrders, serverOrders) {
        const mergedOrders = [...localOrders];
        let changes = 0;

        // Update local orders with server data
        serverOrders.forEach(serverOrder => {
            const localIndex = mergedOrders.findIndex(localOrder => localOrder.id === serverOrder.id);
            
            if (localIndex === -1) {
                // New order from server, add it
                mergedOrders.push(serverOrder);
                changes++;
                console.log('➕ Added new order from server:', serverOrder.id);
            } else {
                // Compare and update if server has newer data
                const localOrder = mergedOrders[localIndex];
                const serverUpdated = new Date(serverOrder.statusUpdated || serverOrder.orderDate);
                const localUpdated = new Date(localOrder.statusUpdated || localOrder.orderDate);
                
                if (serverUpdated > localUpdated || serverOrder.status !== localOrder.status) {
                    mergedOrders[localIndex] = { ...localOrder, ...serverOrder };
                    changes++;
                    console.log('🔄 Updated order from server:', serverOrder.id, serverOrder.status);
                }
            }
        });

        // Remove orders that don't exist on server (except recent ones)
        const finalOrders = mergedOrders.filter(order => {
            const isRecent = new Date() - new Date(order.orderDate) < 24 * 60 * 60 * 1000; // 24 hours
            const existsOnServer = serverOrders.find(so => so.id === order.id);
            return existsOnServer || isRecent;
        });

        if (changes > 0 || finalOrders.length !== localOrders.length) {
            console.log('📈 Sync changes:', {
                updates: changes,
                finalCount: finalOrders.length,
                originalCount: localOrders.length
            });
        }

        // Sort by date (newest first)
        return finalOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    startSync() {
        // Initial sync
        setTimeout(() => this.syncOrders(), 1000);
        
        // Periodic sync
        setInterval(() => {
            this.syncOrders();
        }, this.syncInterval);

        // Sync when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncOrders();
            }
        });
    }

    setupEventListeners() {
        // Listen for storage events (cross-tab synchronization)
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_order_history') {
                console.log('🔄 Storage updated from another tab');
                if (typeof orderHistory !== 'undefined') {
                    orderHistory.loadOrders().then(() => orderHistory.renderOrders());
                }
            }
        });

        // Listen for admin changes (custom event)
        window.addEventListener('orderUpdated', (e) => {
            console.log('🔄 Order update detected, syncing...');
            this.syncOrders();
        });
    }

    // Method to force immediate sync
    async forceSync() {
        console.log('🔄 Manual sync triggered');
        return await this.syncOrders();
    }

    // Method to notify about admin changes
    notifyAdminChange(orderId, action) {
        console.log(`📢 Admin ${action} order ${orderId}`);
        // Trigger sync
        this.syncOrders();
    }
}

// Initialize sync manager
const orderSync = new OrderSyncManager();

// Export for global access
window.orderSync = orderSync;
