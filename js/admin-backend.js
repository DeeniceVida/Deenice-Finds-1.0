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
