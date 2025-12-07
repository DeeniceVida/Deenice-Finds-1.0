// order-history.js - Fixed Version with Loading Fixes
class OrderHistoryManager {
    constructor() {
        this.orders = [];
        this.storageKey = 'de_order_history';
        this.backupKey = 'de_order_history_backup';
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        console.log('🔄 OrderHistoryManager initializing...');
        this.loadOrders();
        this.renderOrders();
        this.setupEventListeners();
        this.fixLoadingIssues(); // NEW: Add loading fix
    }

    // NEW: Fix loading issues
    fixLoadingIssues() {
        console.log('🔧 Fixing client loading issues...');
        
        // Force hide loading elements after 3 seconds
        setTimeout(() => {
            const loadingElements = document.querySelectorAll('.loading, .spinner, .loading-spinner, .loader');
            loadingElements.forEach(element => {
                if (element) {
                    element.style.display = 'none';
                    element.classList.remove('loading');
                }
            });
            
            // Show all content that might be hidden
            const hiddenContent = document.querySelectorAll('[style*="display: none"], .hidden-content');
            hiddenContent.forEach(element => {
                element.style.display = 'block';
                element.style.visibility = 'visible';
            });
            
            // Show empty state if no orders
            if (this.orders.length === 0) {
                this.showEmptyState();
            }
            
            console.log('✅ Loading issues fixed');
        }, 3000); // Max 3 seconds loading
    }

    loadOrders() {
        try {
            // Try primary storage
            let orders = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            
            // If empty, try backup
            if (orders.length === 0) {
                orders = JSON.parse(localStorage.getItem(this.backupKey) || '[]');
                if (orders.length > 0) {
                    // Restore to primary
                    localStorage.setItem(this.storageKey, JSON.stringify(orders));
                }
            }
            
            // Sort by date (newest first)
            this.orders = orders.sort((a, b) => {
                const dateA = new Date(a.orderDate || a.date || 0);
                const dateB = new Date(b.orderDate || b.date || 0);
                return dateB - dateA;
            });
            
            console.log(`📦 Loaded ${this.orders.length} orders from history`);
            
        } catch (error) {
            console.error('❌ Error loading order history:', error);
            this.orders = [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
            localStorage.setItem(this.backupKey, JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving order history:', error);
        }
    }

    renderOrders() {
        const container = document.getElementById('orders-container');
        if (!container) {
            console.error('❌ Orders container not found');
            return;
        }

        if (this.orders.length === 0) {
            this.showEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        if (filteredOrders.length === 0) {
            this.showNoResultsState();
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
        
        // Hide any remaining loading elements
        this.hideAllLoading();
    }

    createOrderCard(order) {
        const orderId = order.id || 'N/A';
        const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleDateString();
        const status = order.status || 'pending';
        const totalAmount = order.totalAmount || order.total || 0;
        const currency = order.currency || 'KES';
        const items = order.items || [];
        const isBuyForMe = order.type === 'buy-for-me' || order.source === 'buy-for-me';
        
        // Get product image (admin will upload this)
        const productImage = order.image || 
                            (items[0] && items[0].image) || 
                            'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';
        
        // Get first item title
        const firstItem = items[0] || {};
        const productTitle = firstItem.title || firstItem.name || 'Buy For Me Product';
        
        // Progress tracking for Buy For Me orders
        let progressHtml = '';
        if (isBuyForMe && window.progressTracker) {
            const progressData = window.progressTracker.getProgressData(order);
            if (progressData) {
                progressHtml = `
                    <div class="order-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressData.progressPercentage}%"></div>
                        </div>
                        <div class="progress-text">
                            ${progressData.currentStep.name} - ${Math.round(progressData.progressPercentage)}%
                        </div>
                    </div>
                `;
            }
        }

        return `
            <div class="order-card" data-order-id="${orderId}">
                <div class="order-header">
                    <div class="order-id">
                        <strong>Order #${orderId}</strong>
                        ${isBuyForMe ? '<span class="bfm-badge">BFM</span>' : ''}
                    </div>
                    <div class="order-date">${orderDate}</div>
                </div>
                
                <div class="order-body">
                    <div class="product-info">
                        <img src="${productImage}" 
                             alt="${productTitle}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image'">
                        <div class="product-details">
                            <div class="product-title">${productTitle}</div>
                            <div class="order-items-count">${items.length} item${items.length !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    
                    ${progressHtml}
                    
                    <div class="order-status">
                        <span class="status-badge status-${status}">${this.formatStatus(status)}</span>
                    </div>
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        <strong>Total:</strong> ${currency} ${totalAmount.toLocaleString()}
                    </div>
                    <div class="order-actions">
                        <button class="btn-view-details" onclick="orderHistory.viewOrderDetails('${orderId}')">
                            View Details
                        </button>
                        ${isBuyForMe ? `
                            <button class="btn-track" onclick="orderHistory.trackOrder('${orderId}')">
                                Track Order
                            </button>
                        ` : ''}
                        ${status === 'completed' ? `
                            <button class="btn-review" onclick="orderHistory.leaveReview('${orderId}')">
                                Leave Review
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    formatStatus(status) {
        const statusMap = {
            'pending': '📝 Pending',
            'processing': '🔄 Processing',
            'shipped': '🚚 Shipped',
            'delivered': '📦 Delivered',
            'completed': '✅ Completed',
            'cancelled': '❌ Cancelled'
        };
        return statusMap[status] || status;
    }

    filterOrders() {
        if (this.currentFilter === 'all') return this.orders;
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    showEmptyState() {
        const container = document.getElementById('orders-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders yet.</p>
                <div class="empty-actions">
                    <a href="/shop.html" class="btn btn-primary">Start Shopping</a>
                    <a href="/buy-for-me.html" class="btn btn-secondary">Buy For Me</a>
                </div>
            </div>
        `;
        
        // Hide loading
        this.hideAllLoading();
    }

    showNoResultsState() {
        const container = document.getElementById('orders-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No orders found</h3>
                <p>No orders match the current filter.</p>
                <button class="btn btn-primary" onclick="orderHistory.setFilter('all')">
                    Show All Orders
                </button>
            </div>
        `;
    }

    hideAllLoading() {
        // Hide any loading indicators
        const loaders = document.querySelectorAll('.loading-indicator, .loading, .spinner');
        loaders.forEach(loader => {
            loader.style.display = 'none';
        });
        
        // Show the orders container
        const container = document.getElementById('orders-container');
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
        }
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-orders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshOrders();
            });
        }

        // Listen for storage updates from admin
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey || e.key === this.backupKey) {
                console.log('🔄 Order history updated from admin');
                this.loadOrders();
                this.renderOrders();
            }
        });

        // Listen for custom order update events
        window.addEventListener('orderUpdated', () => {
            console.log('🔄 Order update event received');
            this.loadOrders();
            this.renderOrders();
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderOrders();
    }

    refreshOrders() {
        console.log('🔄 Refreshing orders...');
        
        // Show loading
        const container = document.getElementById('orders-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Refreshing orders...</p>
                </div>
            `;
        }
        
        // Reload after delay
        setTimeout(() => {
            this.loadOrders();
            this.renderOrders();
            this.showNotification('Orders refreshed', 'success');
        }, 1000);
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }

        const orderDate = new Date(order.orderDate || order.date).toLocaleString();
        const status = order.status || 'pending';
        const totalAmount = order.totalAmount || order.total || 0;
        const currency = order.currency || 'KES';
        const items = order.items || [];
        const customer = order.customer || {};
        
        let details = `
            <div class="order-details-modal">
                <h3>Order #${orderId}</h3>
                
                <div class="details-section">
                    <h4>📋 Order Information</h4>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="status-${status}">${this.formatStatus(status)}</span></p>
                    <p><strong>Total:</strong> ${currency} ${totalAmount.toLocaleString()}</p>
                </div>
                
                <div class="details-section">
                    <h4>👤 Customer Information</h4>
                    <p><strong>Name:</strong> ${customer.name || 'Not specified'}</p>
                    <p><strong>City:</strong> ${customer.city || 'Not specified'}</p>
                    <p><strong>Phone:</strong> ${customer.phone || 'Not specified'}</p>
                </div>
                
                <div class="details-section">
                    <h4>🛍️ Items (${items.length})</h4>
                    <div class="items-list">
        `;

        if (items.length > 0) {
            items.forEach((item, index) => {
                const itemName = item.title || item.name || 'Unknown Item';
                const itemPrice = item.price || 0;
                const itemQty = item.qty || 1;
                const itemTotal = itemPrice * itemQty;
                const itemImage = item.image || 'https://via.placeholder.com/60x60/CCCCCC/666666?text=Item';
                
                details += `
                    <div class="item-detail">
                        <img src="${itemImage}" alt="${itemName}" class="item-image-small"
                             onerror="this.src='https://via.placeholder.com/60x60/CCCCCC/666666?text=Item'">
                        <div class="item-info">
                            <div class="item-name">${itemName}</div>
                            <div class="item-meta">
                                <span>Qty: ${itemQty}</span>
                                <span>Price: ${currency} ${itemPrice.toLocaleString()}</span>
                                <span>Total: ${currency} ${itemTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            details += '<p>No items in this order.</p>';
        }

        details += `
                    </div>
                </div>
                
                <div class="details-actions">
                    <button class="btn btn-secondary" onclick="orderHistory.closeDetailsModal()">Close</button>
                    <button class="btn btn-primary" onclick="orderHistory.contactSupport('${orderId}')">Contact Support</button>
                </div>
            </div>
        `;

        this.showDetailsModal(details);
    }

    showDetailsModal(content) {
        let modal = document.getElementById('orderDetailsModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'orderDetailsModal';
            modal.className = 'modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button class="modal-close" onclick="orderHistory.closeDetailsModal()" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
                ${content}
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    closeDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    trackOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }

        if (window.progressTracker) {
            window.progressTracker.showProgressModal(orderId);
        } else {
            this.showNotification('Tracking not available', 'error');
        }
    }

    leaveReview(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || order.status !== 'completed') {
            this.showNotification('You can only review completed orders', 'error');
            return;
        }

        const review = prompt('Please leave your review for this order:');
        if (review) {
            // Save review
            order.review = review;
            order.reviewDate = new Date().toISOString();
            this.saveOrders();
            this.showNotification('Thank you for your review!', 'success');
        }
    }

    contactSupport(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const message = `Hello, I need support for my order #${orderId}.`;
        const whatsappURL = `https://wa.me/254106590617?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.order-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `order-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize order history
const orderHistory = new OrderHistoryManager();
window.orderHistory = orderHistory;

// Add CSS for loading and transitions
const orderHistoryStyles = `
    /* Loading fixes */
    .loading-state {
        text-align: center;
        padding: 40px;
    }
    
    .loading-spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Order cards */
    .order-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        transition: transform 0.2s ease;
    }
    
    .order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.12);
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }
    
    .bfm-badge {
        background: #8EDBD1;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-left: 8px;
    }
    
    .order-body {
        margin-bottom: 15px;
    }
    
    .product-info {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .product-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
    }
    
    .order-progress {
        margin: 15px 0;
    }
    
    .progress-bar {
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #8EDBD1);
        transition: width 0.3s ease;
    }
    
    .progress-text {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
    }
    
    .order-status {
        margin: 10px 0;
    }
    
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped { background: #d1ecf1; color: #0c5460; }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-completed { background: #d4edda; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    
    .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .order-actions {
        display: flex;
        gap: 10px;
    }
    
    .btn-view-details, .btn-track, .btn-review {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    }
    
    .btn-view-details { background: #007bff; color: white; }
    .btn-track { background: #8EDBD1; color: white; }
    .btn-review { background: #28a745; color: white; }
    
    .btn-view-details:hover { background: #0056b3; }
    .btn-track:hover { background: #6dc9c0; }
    .btn-review:hover { background: #1e7e34; }
    
    /* Empty state */
    .empty-state {
        text-align: center;
        padding: 60px 20px;
    }
    
    .empty-icon {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .empty-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
    }
    
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Filter buttons */
    .filter-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .filter-btn.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }
    
    /* Animation */
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    /* Hide loading elements */
    .loading, .spinner, .loader {
        display: none !important;
    }
`;

// Inject styles
if (!document.getElementById('order-history-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'order-history-styles';
    styleSheet.textContent = orderHistoryStyles;
    document.head.appendChild(styleSheet);
}

// Auto-hide any remaining loading elements on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 Order history page loaded');
    
    // Additional safety: hide all loading elements
    setTimeout(() => {
        const loaders = document.querySelectorAll('.loading, .spinner, .loader, [class*="loading"], [class*="spinner"]');
        loaders.forEach(loader => {
            loader.style.display = 'none';
        });
        
        // Show orders container
        const container = document.getElementById('orders-container');
        if (container) {
            container.style.display = 'block';
        }
    }, 1000);
});

// Export for global access
window.OrderHistoryManager = OrderHistoryManager;
