// emergency-recovery.js - RUN THIS FIRST
(function() {
    console.log('🚨 EMERGENCY RECOVERY STARTED');
    
    // Check ALL possible storage locations
    const storageKeys = [
        'de_order_history',
        'de_order_history_backup', 
        'de_admin_orders',
        'de_admin_orders_backup',
        'order_history',
        'deenice_orders',
        'user_orders',
        'de_orders'
    ];
    
    let allOrders = [];
    const foundOrders = {};
    
    // Collect from ALL sources
    storageKeys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const orders = JSON.parse(data);
                if (Array.isArray(orders) && orders.length > 0) {
                    foundOrders[key] = orders;
                    console.log(`✅ Found ${orders.length} orders in ${key}`);
                    
                    // Merge orders (avoid duplicates)
                    orders.forEach(order => {
                        if (order && order.id) {
                            const exists = allOrders.find(o => o.id === order.id);
                            if (!exists) {
                                allOrders.push(order);
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.log(`❌ Error reading ${key}:`, error);
        }
    });
    
    console.log(`📊 RECOVERY SUMMARY:`, {
        totalUniqueOrders: allOrders.length,
        foundInSources: Object.keys(foundOrders).length,
        sources: Object.keys(foundOrders)
    });
    
    // Save to ALL reliable locations
    if (allOrders.length > 0) {
        // Primary storage with timestamp
        const recoveryData = {
            orders: allOrders,
            recoveredAt: new Date().toISOString(),
            source: 'emergency_recovery',
            totalOrders: allOrders.length
        };
        
        localStorage.setItem('de_admin_orders', JSON.stringify(allOrders));
        localStorage.setItem('de_admin_orders_backup', JSON.stringify(allOrders));
        localStorage.setItem('de_order_history', JSON.stringify(allOrders));
        localStorage.setItem('de_order_history_backup', JSON.stringify(allOrders));
        localStorage.setItem('emergency_recovery_data', JSON.stringify(recoveryData));
        
        console.log(`💾 EMERGENCY RECOVERY COMPLETE: ${allOrders.length} orders saved`);
        alert(`🚨 EMERGENCY RECOVERY: ${allOrders.length} orders recovered and secured!`);
        
        // Show recovered orders
        console.log('📋 RECOVERED ORDERS:', allOrders);
    } else {
        console.log('❌ NO ORDERS FOUND IN ANY STORAGE');
        alert('❌ No orders found in any storage location');
    }
})();
