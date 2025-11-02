class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.init();
    }

    init() {
        this.loadOrders();
        this.renderOrders();
    }

    loadOrders() {
        const savedOrders = localStorage.getItem('de_order_history');
        this.orders = savedOrders ? JSON.parse(savedOrders) : [];
        this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    saveOrders() {
        localStorage.setItem('de_order_history', JSON.stringify(this.orders));
    }

    renderOrders() {
        const container = document.getElementById('orders-list');
        
        if (this.orders.length === 0) {
            container.innerHTML = '<p>No orders found.</p>';
            return;
        }

        container.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <h3>Order #${order.id}</h3>
                <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
                <p><strong>City:</strong> ${order.customer?.city || 'N/A'}</p>
                <p><strong>Total:</strong> ${order.currency} ${order.totalAmount?.toLocaleString() || '0'}</p>
                <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                <p>
                    <strong>Status:</strong>
                    <span class="status-${order.status}">${this.getStatusText(order.status)}</span>
                    <select class="status-select" onchange="adminManager.updateStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </p>
                ${order.statusUpdated ? `<p><strong>Last Updated:</strong> ${new Date(order.statusUpdated).toLocaleString()}</p>` : ''}
                ${order.completedDate ? `<p><strong>Completed:</strong> ${new Date(order.completedDate).toLocaleString()}</p>` : ''}
            </div>
        `).join('');
    }

    updateStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            this.saveOrders();
            this.renderOrders();
            alert(`Order #${orderId} status updated to ${newStatus}`);
        }
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Pending',
            'processing': 'Processing', 
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusTexts[status] || 'Pending';
    }
}

const adminManager = new AdminOrderManager();
