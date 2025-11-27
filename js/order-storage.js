// js/order-storage.js - PERMANENT ORDER STORAGE
class OrderStorageManager {
    constructor() {
        this.storageKey = 'de_order_history';
        this.backupKey = 'de_order_history_backup';
        this.syncKey = 'de_order_sync_markers';
        this.init();
    }

    init() {
        console.log('💾 OrderStorageManager initializing...');
        this.setupCrossTabSync();
        this.setupBackupSystem();
        this.migrateLegacyData();
    }

    // ENHANCED: Get orders with multiple fallback methods
    getOrders() {
        try {
            // Method 1: Primary storage
            let orders = this.getFromStorage(this.storageKey);
            
            // Method 2: Backup storage
            if (!orders || orders.length === 0) {
                console.log('📭 No orders in primary storage, checking backup...');
                orders = this.getFromStorage(this.backupKey);
                if (orders && orders.length > 0) {
                    console.log('✅ Restored orders from backup');
                    this.saveOrders(orders); // Restore to primary
                }
            }

            // Method 3: Legacy data migration
            if (!orders || orders.length === 0) {
                orders = this.migrateFromLegacyStorage();
            }

            return orders || [];
        } catch (error) {
            console.error('❌ Error getting orders:', error);
            return [];
        }
    }

    // ENHANCED: Save orders with progress tracking + multiple backups
saveOrders(orders) {
    try {
        if (!orders || !Array.isArray(orders)) {
            console.error('Invalid orders data:', orders);
            return false;
        }

        console.log(`💾 Saving ${orders.length} orders...`);

        // 🔥 Enhance each order with progress fields
        const enhancedOrders = orders.map(order => {
            const status = order.status || 'pending';
            const statusUpdated = order.statusUpdated || new Date().toISOString();

            return {
                ...order,
                status,
                statusUpdated,
                progressHistory: order.progressHistory || [{
                    status,
                    timestamp: statusUpdated,
                    step: progressTracker.getStepByStatus(status)
                }]
            };
        });

        // Method 1: Primary storage
        localStorage.setItem(this.storageKey, JSON.stringify(enhancedOrders));

        // Method 2: Backup storage
        localStorage.setItem(this.backupKey, JSON.stringify(enhancedOrders));

        // Method 3: Session storage (temporary)
        sessionStorage.setItem(this.storageKey, JSON.stringify(enhancedOrders));

        // Method 4: IndexedDB (permanent)
        this.saveToIndexedDB(enhancedOrders);

        // Trigger storage event for cross-tab sync
        this.triggerStorageEvent(this.storageKey, enhancedOrders);

        console.log(`✅ Orders saved with progress tracking (${enhancedOrders.length} orders)`);
        return true;

    } catch (error) {
        console.error('❌ Error saving orders:', error);
        return false;
    }
}


    // NEW: Save to IndexedDB for permanent storage
    async saveToIndexedDB(orders) {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                resolve(false);
                return;
            }

            const request = indexedDB.open('DeeniceOrders', 1);
            
            request.onerror = () => resolve(false);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['orders'], 'readwrite');
                const store = transaction.objectStore('orders');
                
                const putRequest = store.put(orders, 'orderHistory');
                putRequest.onsuccess = () => resolve(true);
                putRequest.onerror = () => resolve(false);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('orders')) {
                    db.createObjectStore('orders');
                }
            };
        });
    }

    // NEW: Get from IndexedDB
    async getFromIndexedDB() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                resolve(null);
                return;
            }

            const request = indexedDB.open('DeeniceOrders', 1);
            
            request.onerror = () => resolve(null);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['orders'], 'readonly');
                const store = transaction.objectStore('orders');
                
                const getRequest = store.get('orderHistory');
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => resolve(null);
            };
        });
    }

    // Get from storage with validation
    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return null;
        }
    }
    // NEW: Extra protection against accidental deletion
    setupDataProtection() {
        console.log('🛡️ Setting up data protection...');
        
        // Intercept storage clear events
        const originalClear = localStorage.clear;
        localStorage.clear = function() {
            console.warn('🚨 localStorage.clear() attempted - blocking to protect orders');
            
            // Backup orders before any clear attempt
            const orders = localStorage.getItem('de_order_history');
            const backup = localStorage.getItem('de_order_history_backup');
            
            if (orders || backup) {
                console.log('💾 Orders protected from clear operation');
            }
            
            // Don't actually clear - just remove non-order items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !key.includes('de_order') && !key.includes('admin_token')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🧹 Removed ${keysToRemove.length} non-essential items`);
        };

        // Protect against removeItem for order keys
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function(key) {
            if (key && key.includes('de_order')) {
                console.warn(`🚨 Attempt to remove protected order key: ${key}`);
                return; // Block the removal
            }
            originalRemoveItem.call(this, key);
        };

        console.log('✅ Data protection setup complete');
    }

    // Call this in your init method:
    init() {
        console.log('💾 OrderStorageManager initializing...');
        this.setupDataProtection(); // ADD THIS LINE
        this.setupCrossTabSync();
        this.setupBackupSystem();
        this.migrateLegacyData();
    }

    // Setup cross-tab synchronization
    setupCrossTabSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                console.log('🔄 Cross-tab sync detected');
                this.triggerOrderUpdate();
            }
        });

        // Sync every 30 seconds
        setInterval(() => {
            this.syncAcrossTabs();
        }, 30000);
    }

    // Setup automatic backup system
    setupBackupSystem() {
        // Backup every 5 minutes
        setInterval(() => {
            this.createBackup();
        }, 300000);

        // Backup before unload
        window.addEventListener('beforeunload', () => {
            this.createBackup();
        });

        // Backup on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.createBackup();
            }
        });
    }

    // Create backup
    createBackup() {
        const orders = this.getOrders();
        if (orders.length > 0) {
            localStorage.setItem(this.backupKey, JSON.stringify(orders));
            console.log(`💾 Backup created: ${orders.length} orders`);
        }
    }

    // Migrate from legacy storage formats
    migrateFromLegacyStorage() {
        const legacyKeys = [
            'order_history',
            'deenice_orders',
            'user_orders',
            'de_orders'
        ];

        for (const key of legacyKeys) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const orders = JSON.parse(data);
                    if (Array.isArray(orders) && orders.length > 0) {
                        console.log(`🔄 Migrating ${orders.length} orders from ${key}`);
                        this.saveOrders(orders);
                        localStorage.removeItem(key); // Clean up old storage
                        return orders;
                    }
                }
            } catch (error) {
                console.log(`No migration from ${key}`);
            }
        }
        return null;
    }

    // Migrate legacy data
    migrateLegacyData() {
        const orders = this.migrateFromLegacyStorage();
        if (orders && orders.length > 0) {
            console.log(`✅ Migrated ${orders.length} legacy orders`);
        }
    }

    // Sync across browser tabs
    syncAcrossTabs() {
        const orders = this.getOrders();
        this.triggerStorageEvent(this.storageKey, orders);
    }

    // Trigger storage event
    triggerStorageEvent(key, value) {
        try {
            const event = new StorageEvent('storage', {
                key: key,
                newValue: JSON.stringify(value),
                oldValue: localStorage.getItem(key),
                url: window.location.href,
                storageArea: localStorage
            });
            window.dispatchEvent(event);
        } catch (error) {
            // Fallback for browsers that don't allow creating StorageEvent
            window.dispatchEvent(new Event('storage'));
        }
    }

    // Trigger order update event
    triggerOrderUpdate() {
        const event = new CustomEvent('orderStorageUpdated', {
            detail: { orders: this.getOrders() }
        });
        window.dispatchEvent(event);
    }

    // Clear all order data (use with caution)
    clearAllData() {
        const keys = [this.storageKey, this.backupKey, this.syncKey];
        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear IndexedDB
        if (window.indexedDB) {
            indexedDB.deleteDatabase('DeeniceOrders');
        }
        
        console.log('🧹 All order data cleared');
    }

    // Get storage statistics
    getStorageStats() {
        const orders = this.getOrders();
        const primary = this.getFromStorage(this.storageKey) || [];
        const backup = this.getFromStorage(this.backupKey) || [];
        
        return {
            ordersInMemory: orders.length,
            ordersInPrimary: primary.length,
            ordersInBackup: backup.length,
            storageSize: JSON.stringify(orders).length,
            lastBackup: new Date().toISOString()
        };
    }

    // Emergency recovery
    emergencyRecovery() {
        console.log('🚨 Starting emergency recovery...');
        
        const backup = this.getFromStorage(this.backupKey);
        const primary = this.getFromStorage(this.storageKey);
        
        if (backup && backup.length > 0) {
            if (!primary || primary.length === 0 || backup.length > primary.length) {
                console.log(`🔄 Restoring ${backup.length} orders from backup`);
                this.saveOrders(backup);
                return true;
            }
        }
        
        console.log('❌ No recovery needed or no backup available');
        return false;
    }
}

// Initialize global storage manager
const orderStorage = new OrderStorageManager();
window.orderStorage = orderStorage;
