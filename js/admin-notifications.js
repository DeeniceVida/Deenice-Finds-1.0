// js/admin-notifications.js - Admin Change Notifications
class AdminNotificationManager {
    static async notifyOrderChange(orderId, action, changes) {
        // Store change timestamp in localStorage
        const changesKey = `order_change_${orderId}`;
        const changeData = {
            orderId,
            action,
            changes,
            timestamp: new Date().toISOString(),
            admin: true
        };
        
        localStorage.setItem(changesKey, JSON.stringify(changeData));
        
        // Also store in a list of recent changes
        const recentChanges = JSON.parse(localStorage.getItem('recent_order_changes') || '[]');
        recentChanges.unshift(changeData);
        // Keep only last 10 changes
        localStorage.setItem('recent_order_changes', JSON.stringify(recentChanges.slice(0, 10)));
        
        console.log(`📢 Admin ${action} order ${orderId}`);
    }
}

// Add to your admin delete method:
async deleteOrder(orderId) {
    // ... existing delete code ...
    
    // Notify about the deletion
    await AdminNotificationManager.notifyOrderChange(orderId, 'deleted', {
        deletedAt: new Date().toISOString()
    });
    
    // ... rest of delete code ...
}
