// js/order-sync.js - ENHANCED Real-time Order Synchronization with Admin Updates
class OrderSyncManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.syncInterval = 15000; // Reduced to 15 seconds for better responsiveness
        this.lastSyncTime = null;
        this.init();
    }

    init() {
        console.log('🔄 Enhanced OrderSyncManager initializing...');
        this.setupPersistentStorage();
        this.startSync();
        this.setupEventListeners();
        this.setupSyncMonitoring();
        this.setupAdminUpdateListener(); // NEW: Listen for admin updates
    }

    // NEW: Listen for admin status updates
    setupAdminUpdateListener() {
        console.log('👂 Setting up admin update listener...');
        
        // Listen for custom admin update events
        window.addEventListener('adminOrderUpdate', (e) => {
            console.log('📢 Admin update event received:', e.detail);
            this.handleAdminStatusUpdate(e.detail);
        });

        // Listen for storage changes (admin updates localStorage directly)
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_order_history' || e.key === 'de_order_sync_markers') {
                console.log('🔄 Storage change detected, checking for admin updates...');
                this.checkForAdminUpdates();
            }
        });

        // Listen for visibility changes (when user comes back to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('📱 Page visible, checking for admin updates...');
                this.checkForAdminUpdates();
            }
        });

        console.log('✅ Admin update listener setup complete');
    }

    // NEW: Handle admin status updates immediately
    handleAdminStatusUpdate(updateDetail) {
        const { orderId, newStatus, timestamp } = updateDetail;
        console.log(`🔄 Processing admin status update: ${orderId} -> ${newStatus}`);
        
        // Update local storage immediately
        this.updateLocalOrderStatus(orderId, newStatus, timestamp);
        
        // Update UI if on order history page
        this.updateOrderHistoryUI();
        
        // Show notification to user
        this.showStatusUpdateNotification(orderId, newStatus);
    }

    // NEW: Update local order status
    updateLocalOrderStatus(orderId, newStatus, timestamp) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const orderIndex = localOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                localOrders[orderIndex].status = newStatus;
                localOrders[orderIndex].statusUpdated = timestamp || new Date().toISOString();
                if (newStatus === 'completed') {
                    localOrders[orderIndex].completedDate = timestamp || new Date().toISOString();
                }
                
                localStorage.setItem('de_order_history', JSON.stringify(localOrders));
                console.log(`✅ Updated local order ${orderId} to ${newStatus}`);
                return true;
            } else {
                console.log(`⚠️ Order ${orderId} not found in local storage, will sync on next refresh`);
                return false;
            }
        } catch (error) {
            console.error('Error updating local order status:', error);
            return false;
        }
    }

    // NEW: Check for admin updates in sync markers
    async checkForAdminUpdates() {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            const orderIds = Object.keys(markers);
            
            if (orderIds.length > 0) {
                console.log('🔍 Checking admin updates for orders:', orderIds);
                
                // Update local orders from markers
                let updatedCount = 0;
                orderIds.forEach(orderId => {
                    const marker = markers[orderId];
                    if (marker && marker.source === 'admin') {
                        if (this.updateLocalOrderStatus(orderId, marker.status, marker.updated)) {
                            updatedCount++;
                        }
                    }
                });
                
                if (updatedCount > 0) {
                    console.log(`✅ Updated ${updatedCount} orders from admin changes`);
                    this.updateOrderHistoryUI();
                    
                    // Clear processed markers
                    this.clearProcessedMarkers(orderIds);
                }
                
                // Also do a full sync to be sure
                await this.syncOrders();
            }
        } catch (error) {
            console.error('Error checking admin updates:', error);
        }
    }

    // NEW: Clear processed markers
    clearProcessedMarkers(processedOrderIds) {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            processedOrderIds.forEach(orderId => {
                delete markers[orderId];
            });
            localStorage.setItem('de_order_sync_markers', JSON.stringify(markers));
        } catch (error) {
            console.error('Error clearing markers:', error);
        }
    }

    // NEW: Show status update notification to user
    showStatusUpdateNotification(orderId, newStatus) {
        const statusMessages = {
            'processing': `🔄 Your order #${orderId} is now being processed!`,
            'completed': `✅ Your order #${orderId} has been completed!`,
            'cancelled': `❌ Your order #${orderId} has been cancelled.`
        };

        const message = statusMessages[newStatus];
        if (message && this.shouldShowNotification()) {
            this.showSyncNotification(message);
            
            // Also update browser tab title for attention
            this.flashTabTitle(`Order Updated: #${orderId}`);
        }
    }

    // NEW: Check if we should show notification
    shouldShowNotification() {
        // Don't show if user is currently on order history page
        return !document.querySelector('.order-history-page') || 
               document.hidden; // Show if tab is not active
    }

    // NEW: Flash tab title for attention
    flashTabTitle(message, flashes = 3) {
        const originalTitle = document.title;
        let count = 0;
        
        const flash = setInterval(() => {
            document.title = (document.title === originalTitle) ? message : originalTitle;
            count++;
            
            if (count >= flashes * 2) {
                document.title = originalTitle;
                clearInterval(flash);
            }
        }, 1000);
    }

    // ENHANCED sync method with admin update detection
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

            // Check for status changes and notify user
            this.notifyStatusChanges(localOrders, mergedOrders);

            return mergedOrders;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.handleSyncError(error);
            return JSON.parse(localStorage.getItem('de_order_history') || '[]');
        }
    }

    // NEW: Notify user about status changes
    notifyStatusChanges(oldOrders, newOrders) {
        const oldOrderMap = new Map(oldOrders.map(order => [order.id, order]));
        
        newOrders.forEach(newOrder => {
            const oldOrder = oldOrderMap.get(newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
                console.log(`🔄 Status change detected: ${newOrder.id} ${oldOrder.status} -> ${newOrder.status}`);
                this.showStatusUpdateNotification(newOrder.id, newOrder.status);
            }
        });
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
                // Server data takes precedence, especially for status
                const mergedOrder = {
                    ...existingOrder,
                    ...serverOrder,
                    source: 'server'
                };
                
                // Preserve some local fields if they're better
                if (existingOrder.items && existingOrder.items.length > 0) {
                    mergedOrder.items = existingOrder.items;
                }
                if (existingOrder.customer && existingOrder.customer.phone) {
                    mergedOrder.customer = { ...serverOrder.customer, ...existingOrder.customer };
                }
                
                orderMap.set(serverOrder.id, mergedOrder);
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
            orderHistory.orders = orders || JSON.parse(localStorage.getItem('de_order_history') || '[]');
            orderHistory.renderOrders();
            
            // Show sync notification only if we have specific updates
            if (orders && orders.length > 0) {
                this.showSyncNotification('Orders updated successfully!');
            }
        } else {
            console.log('ℹ️ Order history not initialized on this page');
        }
    }

    // NEW: Setup persistent storage (from previous solution)
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

    // ... (keep all your existing methods like showSyncNotification, startSync, etc.)

    setupEventListeners() {
        // Listen for manual refresh triggers
        window.addEventListener('manualRefresh', () => {
            this.forceSync();
        });

        // Enhanced admin updates listener
        window.addEventListener('adminOrderUpdate', (e) => {
            console.log('👑 Admin update received:', e.detail);
            this.handleAdminStatusUpdate(e.detail);
        });
    }

    // ENHANCED force sync with admin update check
    async forceSync() {
        console.log('🔄 Manual force sync triggered');
        try {
            await this.syncOrders();
            await this.checkForAdminUpdates();
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
