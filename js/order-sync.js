// js/order-sync.js - Simple Order Synchronization
class OrderSyncManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.init();
    }

    init() {
        this.startPolling();
        this.setupStorageListener();
    }

    // Simple polling to check for order updates
    startPolling() {
        // Check for updates every 20 seconds
        setInterval(() => {
            this.checkForOrderUpdates();
        }, 20000);

        // Also check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForOrderUpdates();
            }
        });
    }

    async checkForOrderUpdates() {
        try {
            console.log('🔄 Checking for order updates...');
            
            // Get current localStorage orders
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            
            // Get orders from server (using your existing endpoint)
            const response = await fetch(`${this.baseURL}/orders`);
            
            if (response.ok) {
                const serverData = await response.json();
                const serverOrders = serverData.orders || serverData || [];
                
                // Merge server orders with local orders
                this.mergeOrders(localOrders, serverOrders);
            }
        } catch (error) {
            console.log('❌ Update check failed:', error);
        }
    }

    mergeOrders(localOrders, serverOrders) {
        let hasChanges = false;
        const mergedOrders = [...localOrders];

        serverOrders.forEach(serverOrder => {
            const localIndex = mergedOrders.findIndex(localOrder => localOrder.id === serverOrder.id);
            
            if (localIndex === -1) {
                // New order from server, add it
                mergedOrders.push(serverOrder);
                hasChanges = true;
            } else {
                // Compare and update if server has newer data
                const localOrder = mergedOrders[localIndex];
                const serverUpdated = new Date(serverOrder.updatedAt || serverOrder.orderDate);
                const localUpdated = new Date(localOrder.updatedAt || localOrder.orderDate);
                
                if (serverUpdated > localUpdated || serverOrder.status !== localOrder.status) {
                    mergedOrders[localIndex] = serverOrder;
                    hasChanges = true;
                }
            }
        });

        // Remove orders that don't exist on server (except recently created ones)
        const finalOrders = mergedOrders.filter(order => {
            const isRecent = new Date() - new Date(order.orderDate) < 24 * 60 * 60 * 1000; // 24 hours
            const existsOnServer = serverOrders.find(so => so.id === order.id);
            return existsOnServer || isRecent;
        });

        if (hasChanges || finalOrders.length !== localOrders.length) {
            localStorage.setItem('de_order_history', JSON.stringify(finalOrders));
            console.log('✅ Orders updated from server');
            
            // Refresh the order history display if on the page
            if (typeof orderHistory !== 'undefined') {
                orderHistory.loadOrders().then(() => orderHistory.renderOrders());
            }
        }
    }

    setupStorageListener() {
        // Listen for storage changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_order_history' && e.newValue) {
                console.log('🔄 Storage updated from another tab');
                if (typeof orderHistory !== 'undefined') {
                    orderHistory.loadOrders().then(() => orderHistory.renderOrders());
                }
            }
        });
    }

    // Method for admin to force sync after changes
    async forceSync() {
        await this.checkForOrderUpdates();
    }
}

// Initialize sync manager
const orderSync = new OrderSyncManager();

// Export for admin to use
window.orderSync = orderSync;
