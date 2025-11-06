class BackendAdminManager {
    constructor() {
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        // NEW: Validate token structure
        if (!this.isValidToken(this.token)) {
            this.logout();
            return;
        }
        
        this.loadOrders();
    }

    // NEW: Validate token structure
    isValidToken(token) {
        try {
            const decoded = JSON.parse(atob(token));
            return decoded && decoded.username && decoded.role === 'admin';
        } catch (e) {
            return false;
        }
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            
            // NEW: If backend fails but we have valid local token, continue
            if (this.isValidToken(this.token)) {
                console.log('Using local admin session despite backend error');
                return { orders: [], stats: {} }; // Return empty data
            }
            
            throw error;
        }
    }

    async loadOrders() {
        try {
            const data = await this.makeRequest('/orders');
            this.orders = data.orders || [];
            this.renderStats(data.stats || {});
            this.renderOrders();
        } catch (error) {
            console.error('Failed to load orders:', error);
            
            // NEW: Show local admin interface even if backend fails
            this.orders = [];
            this.renderStats({});
            this.renderOrders();
            
            // Show warning but don't block access
            console.warn('Backend unavailable, using local admin session');
        }
    }

    async updateStatus(orderId, newStatus) {
        try {
            await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            await this.loadOrders(); // Reload orders
            this.showNotification(`Order #${orderId} status updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Failed to update status:', error);
            this.showNotification('Failed to update order status. Backend may be unavailable.', 'error');
        }
    }

    // NEW: Better notification system
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.admin-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#FF3B30' : '#007AFF'};
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
        window.location.href = 'admin-login.html';
    }

    // ... include the same render methods from your existing AdminOrderManager
}
// Add this function to your admin-backend.js file
function addCategoriesManagement() {
    // Check if admin is logged in
    if (!isAdminLoggedIn()) {
        return;
    }

    // Create categories management button
    const categoriesBtn = document.createElement('button');
    categoriesBtn.id = 'manage-categories-btn';
    categoriesBtn.innerHTML = '📁 Manage Categories';
    categoriesBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 9999;
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 0.9em;
        font-weight: 500;
        transition: all 0.3s ease;
    `;

    // Add hover effects
    categoriesBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });

    categoriesBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });

    // Add click handler
    categoriesBtn.addEventListener('click', function() {
        // Make sure categoriesManager is available
        if (typeof categoriesManager !== 'undefined') {
            categoriesManager.openCategoriesManager();
        } else {
            console.error('Categories manager not loaded');
            alert('Categories manager not available. Please refresh the page.');
        }
    });

    // Add to page
    document.body.appendChild(categoriesBtn);

    console.log('✅ Categories management button added');
}

// Initialize when admin backend loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure categories manager is loaded
    setTimeout(() => {
        if (isAdminLoggedIn()) {
            addCategoriesManagement();
            
            // Also update navigation with categories
            if (typeof categoriesManager !== 'undefined') {
                categoriesManager.updateNavigation();
            }
        }
    }, 1000);
});

// Also add to your admin login function
function enhanceAdminLogin() {
    // Your existing login code...
    
    // After successful login, add categories management
    setTimeout(() => {
        addCategoriesManagement();
        
        // Update navigation with current categories
        if (typeof categoriesManager !== 'undefined') {
            categoriesManager.updateNavigation();
        }
    }, 500);
}
