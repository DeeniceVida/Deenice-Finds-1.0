class BackendAdminManager {
    constructor() {
        this.baseURL = 'https://your-render-backend-url.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = 'admin-login.html';
            return;
        }
        this.loadOrders();
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
            throw error;
        }
    }

    async loadOrders() {
        try {
            const data = await this.makeRequest('/orders');
            this.orders = data.orders;
            this.renderStats(data.stats);
            this.renderOrders();
        } catch (error) {
            console.error('Failed to load orders:', error);
            alert('Failed to load orders. Please check your connection.');
        }
    }

    async updateStatus(orderId, newStatus) {
        try {
            await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            await this.loadOrders(); // Reload orders
            alert(`Order #${orderId} status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status.');
        }
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'admin-login.html';
    }

    // ... include the same render methods from your existing AdminOrderManager
}
