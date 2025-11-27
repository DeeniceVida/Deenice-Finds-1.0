// js/order-sync.js - ENHANCED Real-time Order Synchronization
class OrderSyncManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.syncInterval = 10000; // Reduced to 10 seconds for better responsiveness
        this.lastSyncTime = null;
        this.isSyncing = false;
        this.init();
    }

    init() {
        console.log('🔄 Enhanced OrderSyncManager initializing...');
        this.setupPersistentStorage();
        this.setupAdminUpdateListener(); // MUST BE FIRST
        this.startSync();
        this.setupEventListeners();
        this.setupSyncMonitoring();
    }

    // ENHANCED: Setup admin update listener with multiple fallbacks
    setupAdminUpdateListener() {
        console.log('👂 Setting up enhanced admin update listener...');
        
        // Method 1: Listen for custom admin update events
        window.addEventListener('adminOrderUpdate', (e) => {
            console.log('📢 Admin update event received:', e.detail);
            this.handleAdminStatusUpdate(e.detail);
        });

        // Method 2: Listen for storage changes (admin updates localStorage directly)
        window.addEventListener('storage', (e) => {
            console.log('💾 Storage change detected:', e.key);
            
            if (e.key === 'de_order_history') {
                console.log('🔄 Order history storage change, checking for updates...');
                this.checkForStorageUpdates();
            }
            
            if (e.key === 'de_order_sync_markers') {
                console.log('📝 Sync markers updated, checking for admin changes...');
                this.processSyncMarkers();
            }
            
            if (e.key === 'de_admin_updates') {
                console.log('👑 Admin updates detected...');
                this.processAdminUpdates();
            }
        });

        // Method 3: Poll for changes (fallback)
        this.startUpdatePolling();

        // Method 4: Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('📱 Page visible, checking for admin updates...');
                this.checkForAdminUpdates();
            }
        });

        console.log('✅ Enhanced admin update listener setup complete');
    }

    // NEW: Handle admin status updates immediately
    handleAdminStatusUpdate(updateDetail) {
        const { orderId, newStatus, timestamp } = updateDetail;
        console.log(`🔄 Processing admin status update: ${orderId} -> ${newStatus}`);
        
        // Update local storage immediately
        const updated = this.updateLocalOrderStatus(orderId, newStatus, timestamp);
        
        if (updated) {
            // Update UI immediately if on order history page
            this.updateOrderHistoryUI();
            
            // Show notification to user
            this.showStatusUpdateNotification(orderId, newStatus);
            
            // Mark as processed
            this.markUpdateProcessed(orderId);
        } else {
            console.log(`⚠️ Could not update order ${orderId}, will sync on next refresh`);
            this.forceSync();
        }
    }

    // NEW: Update local order status
    updateLocalOrderStatus(orderId, newStatus, timestamp) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const orderIndex = localOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                const oldStatus = localOrders[orderIndex].status;
                localOrders[orderIndex].status = newStatus;
                localOrders[orderIndex].statusUpdated = timestamp || new Date().toISOString();
                if (newStatus === 'completed') {
                    localOrders[orderIndex].completedDate = timestamp || new Date().toISOString();
                }
                
                localStorage.setItem('de_order_history', JSON.stringify(localOrders));
                console.log(`✅ Updated local order ${orderId} from ${oldStatus} to ${newStatus}`);
                return true;
            } else {
                console.log(`⚠️ Order ${orderId} not found in local storage`);
                return false;
            }
        } catch (error) {
            console.error('Error updating local order status:', error);
            return false;
        }
    }

    // NEW: Check for storage updates
    checkForStorageUpdates() {
        try {
            const currentOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            
            // If we have order history instance, update it
            if (typeof orderHistory !== 'undefined' && orderHistory.orders) {
                const hasChanges = this.detectOrderChanges(orderHistory.orders, currentOrders);
                if (hasChanges) {
                    console.log('🔄 Storage changes detected, updating UI...');
                    orderHistory.orders = currentOrders;
                    orderHistory.renderOrders();
                    this.showSyncNotification('Orders updated!');
                }
            }
        } catch (error) {
            console.error('Error checking storage updates:', error);
        }
    }

    // NEW: Process sync markers
    processSyncMarkers() {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            let processedCount = 0;
            
            Object.entries(markers).forEach(([orderId, marker]) => {
                if (marker && marker.source === 'admin') {
                    console.log(`🔄 Processing sync marker: ${orderId} -> ${marker.status}`);
                    if (this.updateLocalOrderStatus(orderId, marker.status, marker.updated)) {
                        processedCount++;
                    }
                }
            });
            
            if (processedCount > 0) {
                console.log(`✅ Processed ${processedCount} orders from sync markers`);
                this.updateOrderHistoryUI();
                
                // Clear processed markers
                this.clearProcessedMarkers(Object.keys(markers));
            }
        } catch (error) {
            console.error('Error processing sync markers:', error);
        }
    }

    // NEW: Process admin updates from shared storage
    processAdminUpdates() {
        try {
            const adminUpdates = JSON.parse(localStorage.getItem('de_admin_updates') || '[]');
            let processedCount = 0;
            
            adminUpdates.forEach(update => {
                if (update && update.orderId && update.newStatus) {
                    console.log(`🔄 Processing admin update: ${update.orderId} -> ${update.newStatus}`);
                    if (this.updateLocalOrderStatus(update.orderId, update.newStatus, update.timestamp)) {
                        processedCount++;
                    }
                }
            });
            
            if (processedCount > 0) {
                console.log(`✅ Processed ${processedCount} admin updates`);
                this.updateOrderHistoryUI();
                
                // Clear processed updates
                localStorage.removeItem('de_admin_updates');
            }
        } catch (error) {
            console.error('Error processing admin updates:', error);
        }
    }

    // NEW: Start update polling (fallback method)
    startUpdatePolling() {
        // Check for updates every 5 seconds
        setInterval(() => {
            this.checkForAdminUpdates();
        }, 5000);
    }

    // NEW: Comprehensive admin update check
    checkForAdminUpdates() {
        this.processSyncMarkers();
        this.processAdminUpdates();
        
        // Also check if order history needs refresh
        if (typeof orderHistory !== 'undefined') {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            if (orderHistory.orders.length !== localOrders.length) {
                console.log('🔄 Order count mismatch, refreshing...');
                orderHistory.loadOrders().then(() => orderHistory.renderOrders());
            }
        }
    }

    // NEW: Mark update as processed
    markUpdateProcessed(orderId) {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            delete markers[orderId];
            localStorage.setItem('de_order_sync_markers', JSON.stringify(markers));
        } catch (error) {
            console.error('Error marking update processed:', error);
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

    // NEW: Detect order changes
    detectOrderChanges(oldOrders, newOrders) {
        if (oldOrders.length !== newOrders.length) return true;
        
        const oldMap = new Map(oldOrders.map(order => [order.id, order]));
        
        for (const newOrder of newOrders) {
            const oldOrder = oldMap.get(newOrder.id);
            if (!oldOrder || oldOrder.status !== newOrder.status) {
                return true;
            }
        }
        
        return false;
    }

    // NEW: Show status update notification to user
    showStatusUpdateNotification(orderId, newStatus) {
        const statusMessages = {
            'processing': `🔄 Your order #${orderId} is now being processed! We're preparing your items.`,
            'completed': `✅ Your order #${orderId} has been completed! Thank you for your purchase.`,
            'cancelled': `❌ Your order #${orderId} has been cancelled. Contact support for details.`
        };

        const message = statusMessages[newStatus];
        if (message) {
            this.showSyncNotification(message);
            
            // Flash tab title for attention if page is not active
            if (document.hidden) {
                this.flashTabTitle(`Order Updated: #${orderId}`);
            }
        }
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

    // ENHANCED sync method with better error handling
    async syncOrders() {
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress, skipping...');
            return;
        }

        this.isSyncing = true;
        
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
        } finally {
            this.isSyncing = false;
        }
    }

    // NEW: Notify user about status changes
    notifyStatusChanges(oldOrders, newOrders) {
        const oldOrderMap = new Map(oldOrders.map(order => [order.id, order]));
        let changeCount = 0;
        
        newOrders.forEach(newOrder => {
            const oldOrder = oldOrderMap.get(newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
                console.log(`🔄 Status change detected: ${newOrder.id} ${oldOrder.status} -> ${newOrder.status}`);
                this.showStatusUpdateNotification(newOrder.id, newOrder.status);
                changeCount++;
            }
        });
        
        if (changeCount > 0) {
            console.log(`📢 Notified about ${changeCount} status changes`);
        }
    }

    // ENHANCED merge with progress tracking + server priority
enhancedMergeOrders(localOrders, serverOrders) {
    const orderMap = new Map();

    // 1️⃣ Add all local orders first
    localOrders.forEach(order => {
        orderMap.set(order.id, { 
            ...order, 
            source: 'local',
            progressHistory: order.progressHistory || []  // ensure exists
        });
    });

    // 2️⃣ Merge with server orders (server wins conflicts)
    serverOrders.forEach(serverOrder => {
        const existingOrder = orderMap.get(serverOrder.id);

        if (existingOrder) {
            // 🔥 Merge PROGRESS HISTORY carefully
            const mergedProgressHistory = [
                ...(existingOrder.progressHistory || []),
                ...(serverOrder.progressHistory || [])
            ]
            // Remove duplicates (same timestamp + status)
            .filter((item, index, self) => 
                index === self.findIndex(t =>
                    t.timestamp === item.timestamp &&
                    t.status === item.status
                )
            )
            // Sort chronologically
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // 🔥 Create merged order (server overrides other fields)
            const mergedOrder = {
                ...existingOrder,
                ...serverOrder,
                progressHistory: mergedProgressHistory,
                source: 'server'
            };

            orderMap.set(serverOrder.id, mergedOrder);
            console.log('🔄 Updated order from server:', serverOrder.id, serverOrder.status);

        } else {
            // New order from server
            orderMap.set(serverOrder.id, {
                ...serverOrder,
                progressHistory: serverOrder.progressHistory || [],
                source: 'server'
            });
            console.log('➕ Added new order from server:', serverOrder.id);
        }
    });

    // 3️⃣ Convert map → array
    const mergedOrders = Array.from(orderMap.values());

    // 4️⃣ Sort orders (newest first)
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
        } else {
            console.log('ℹ️ Order history not initialized on this page');
        }
    }

    // NEW: Setup persistent storage
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
                    this.updateOrderHistoryUI();
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

    // Show sync notification
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
        
        // Periodic sync
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

    setupSyncMonitoring() {
        // Monitor for admin sync events
        window.addEventListener('storage', (e) => {
            if (e.key === 'de_sync_events') {
                console.log('📢 Sync event detected, forcing immediate sync');
                this.forceSync();
            }
        });
    }
}

// Initialize enhanced sync manager
const orderSync = new OrderSyncManager();
window.orderSync = orderSync;

// Auto-initialize if on order history page
if (document.querySelector('.order-history-page') || window.location.pathname.includes('order-history')) {
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.orderSync) {
            window.orderSync = new OrderSyncManager();
        }
    });
}
