class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing with backend...');
        if (!this.token) {
            window.location.href = 'admin-login.html';
            return;
        }
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
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

    async loadOrdersFromBackend() {
        try {
            console.log('📥 Loading orders from backend...');
            const data = await this.makeRequest('/orders');
            
            // Handle different response structures
            if (data.orders) {
                this.orders = data.orders;
            } else if (Array.isArray(data)) {
                this.orders = data;
            } else {
                this.orders = [];
            }
            
            console.log('✅ Backend orders loaded:', this.orders.length);
            console.log('📋 Orders data:', this.orders);
            
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            
            // Fallback: Try to load from localStorage as backup
            try {
                const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
                this.orders = localOrders;
                console.log('🔄 Using localStorage orders as fallback:', this.orders.length);
            } catch (fallbackError) {
                console.error('❌ Fallback also failed:', fallbackError);
                this.orders = [];
            }
            
            alert('Failed to load orders from backend. Using local data.');
        }
    }

    async updateStatus(orderId, newStatus) {
        try {
            console.log('🔄 Updating order status:', orderId, newStatus);
            
            // Update in backend
            const response = await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            // Reload orders to get fresh data
            await this.loadOrdersFromBackend();
            this.renderStats();
            this.renderOrders();
            
            console.log('📱 Full server response:', response);
            
            // Find the updated order
            const updatedOrder = this.orders.find(order => order.id === orderId);
            
            // Show WhatsApp notification option
            if (updatedOrder && updatedOrder.customer?.phone) {
                console.log('✅ Customer phone available, showing confirm dialog');
                const sendMsg = confirm(
                    `✅ Order #${orderId} updated to ${newStatus}!\n\n` +
                    `Customer: ${updatedOrder.customer?.name || 'N/A'}\n` +
                    `Phone: ${updatedOrder.customer?.phone || 'No phone'}\n\n` +
                    `Send WhatsApp notification to customer?`
                );
                
                if (sendMsg) {
                    this.sendWhatsAppNotification(updatedOrder, newStatus);
                }
            } else {
                alert(`✅ Order #${orderId} updated to ${newStatus}!`);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status: ' + error.message);
        }
    }

    sendWhatsAppNotification(order, newStatus) {
        const customerPhone = order.customer?.phone;
        if (!customerPhone) {
            alert('No customer phone number available for WhatsApp notification.');
            return;
        }

        const statusMessages = {
            'processing': `🔄 Your order #${order.id} is now being processed. We'll update you when it's ready!`,
            'completed': `✅ Your order #${order.id} has been completed! ${order.delivery?.method === 'pickup' ? 'Ready for pickup!' : 'On its way to you!'}`,
            'cancelled': `❌ Your order #${order.id} has been cancelled. Contact us for details.`
        };

        const message = statusMessages[newStatus] || 
                       `📢 Update on your order #${order.id}: Status changed to ${newStatus}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${customerPhone}?text=${encodedMessage}`;
        
        console.log('🔄 Opening WhatsApp URL:', whatsappURL);
        
        // Open WhatsApp
        const newWindow = window.open(whatsappURL, '_blank');
        
        if (!newWindow) {
            // Fallback for blocked popups
            setTimeout(() => {
                const manualOpen = confirm(
                    "WhatsApp didn't open automatically.\n\n" +
                    "Click OK to copy the WhatsApp link and open it manually."
                );
                if (manualOpen) {
                    navigator.clipboard.writeText(whatsappURL).then(() => {
                        alert("📱 WhatsApp link copied! Please paste it in your browser to send the notification.");
                    });
                }
            }, 1000);
        }
    }

    async deleteOrder(orderId) {
        try {
            const confirmDelete = confirm(
                `🗑️ DELETE ORDER #${orderId}\n\n` +
                `Are you sure you want to delete this order?\n\n` +
                `This will remove the order from:\n` +
                `• Admin panel\n` +
                `• Backend server memory\n` +
                `• Customer's order history\n\n` +
                `This action cannot be undone!`
            );
            
            if (!confirmDelete) return;

            console.log('🗑️ Deleting order from backend:', orderId);
            
            // 1. Call backend API to delete from server memory
            await this.makeRequest(`/orders/${orderId}`, {
                method: 'DELETE'
            });
            
            console.log('✅ Order deleted from backend');

            // 2. Remove from frontend memory
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex > -1) {
                this.orders.splice(orderIndex, 1);
                console.log('✅ Removed from frontend memory');
            }

            // 3. Remove from ALL localStorage instances
            this.removeOrderFromAllClients(orderId);

            // 4. Update the UI
            this.renderStats();
            this.renderOrders();
            
            alert(`✅ Order #${orderId} has been deleted successfully!`);
            
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Failed to delete order: ' + error.message);
        }
    }

    removeOrderFromAllClients(orderId) {
        try {
            // Remove from the main order history
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const updatedLocalOrders = localOrders.filter(order => order.id !== orderId);
            localStorage.setItem('de_order_history', JSON.stringify(updatedLocalOrders));
            console.log('✅ Removed from client localStorage');

            // Also remove from any other potential storage locations
            const storageKeys = ['de_order_history', 'deenice_orders', 'cart_orders'];
            storageKeys.forEach(key => {
                try {
                    const storedData = localStorage.getItem(key);
                    if (storedData) {
                        const data = JSON.parse(storedData);
                        if (Array.isArray(data)) {
                            const filteredData = data.filter(item => item.id !== orderId);
                            localStorage.setItem(key, JSON.stringify(filteredData));
                        }
                    }
                } catch (e) {
                    console.log(`No data found in ${key}`);
                }
            });

        } catch (error) {
            console.error('Error removing from client storage:', error);
        }
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'admin-login.html';
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Add refresh button listener
        const refreshBtn = document.querySelector('.btn-primary');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                refreshBtn.textContent = 'Refreshing...';
                
                await this.loadOrdersFromBackend();
                this.renderStats();
                this.renderOrders();
                
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Refresh';
                alert('Orders refreshed from backend!');
            });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderOrders();
    }

    renderStats() {
        const stats = {
            total: this.orders.length,
            pending: this.orders.filter(o => o.status === 'pending').length,
            processing: this.orders.filter(o => o.status === 'processing').length,
            completed: this.orders.filter(o => o.status === 'completed').length,
            cancelled: this.orders.filter(o => o.status === 'cancelled').length
        };

        console.log('📊 Rendering stats:', stats);

        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number stat-total">${stats.total}</div>
                    <div>Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-pending">${stats.pending}</div>
                    <div>Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-processing">${stats.processing}</div>
                    <div>Processing</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-completed">${stats.completed}</div>
                    <div>Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-cancelled">${stats.cancelled}</div>
                    <div>Cancelled</div>
                </div>
            `;
        }
    }

    renderOrders() {
        const container = document.getElementById('ordersTableBody');
        
        console.log('🎨 Rendering orders to table body...');
        console.log('🔍 Current filter:', this.currentFilter);
        console.log('📋 Orders to render:', this.orders.length);

        if (this.orders.length === 0) {
            console.log('🔄 Showing empty state');
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        console.log('✅ Filtered orders:', filteredOrders.length);
        
        if (filteredOrders.length === 0) {
            console.log('🔄 Showing no results state');
            container.innerHTML = this.getNoResultsState();
            return;
        }

        console.log('🖼️ Creating order table rows...');
        container.innerHTML = filteredOrders.map(order => this.createOrderRow(order)).join('');
        console.log('✅ Orders rendered successfully');
    }

    filterOrders() {
        if (this.currentFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    createOrderRow(order) {
        console.log('🛠️ Creating table row for order:', order.id);
        
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const customerName = order.customer?.name || 'N/A';
        const customerCity = order.customer?.city || 'N/A';
        const customerPhone = order.customer?.phone || 'No phone';

        return `
            <tr data-order-id="${order.id}">
                <td>
                    <strong>#${order.id}</strong>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${customerName}</div>
                        <div class="customer-email">${customerCity}</div>
                        <div class="customer-email">${customerPhone}</div>
                    </div>
                </td>
                <td>${orderDate}</td>
                <td>
                    <div class="order-items-preview">
                        ${(order.items || []).slice(0, 2).map(item => this.createOrderItemPreview(item)).join('')}
                        ${(order.items || []).length > 2 ? 
                            `<div class="item-name-small">+${(order.items || []).length - 2} more items</div>` : 
                            ''}
                    </div>
                </td>
                <td>
                    <strong>${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}</strong>
                </td>
                <td>
                    <select class="status-select ${this.getStatusClass(order.status)}" 
                            onchange="adminManager.updateStatus('${order.id}', this.value)"
                            style="border: none; background: transparent; color: inherit; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <div class="actions">
                        <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">
                            View
                        </button>
                        <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">
                            Contact
                        </button>
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    createOrderItemPreview(item) {
        return `
            <div class="order-item-preview">
                <img src="${item.img || 'https://via.placeholder.com/30'}" 
                     alt="${item.title}" 
                     class="item-image-small"
                     onerror="this.src='https://via.placeholder.com/30x30?text=No+Image'">
                <div class="item-name-small">${item.title || 'Unknown Item'}</div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'processing': 'status-processing',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const details = `
Order #${order.id} - Details

CUSTOMER INFORMATION:
Name: ${order.customer?.name || 'N/A'}
City: ${order.customer?.city || 'N/A'}
Phone: ${order.customer?.phone || 'Not provided'}

ORDER INFORMATION:
Status: ${order.status}
Order Date: ${new Date(order.orderDate).toLocaleString()}
Last Updated: ${order.statusUpdated ? new Date(order.statusUpdated).toLocaleString() : 'N/A'}
${order.completedDate ? `Completed: ${new Date(order.completedDate).toLocaleString()}` : ''}

DELIVERY:
Method: ${this.getDeliveryText(order)}
${order.delivery?.pickupCode ? `Pickup Code: ${order.delivery.pickupCode}` : ''}

ITEMS (${order.items?.length || 0}):
${order.items ? order.items.map((item, index) => 
    `${index + 1}. ${item.title} - ${item.qty} × ${item.currency} ${item.price}`
).join('\n') : 'No items'}

TOTAL: ${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}
            `;
            alert(details);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.customer?.phone) {
            const message = `Hello ${order.customer?.name || 'there'}, this is Deenice Finds regarding your order #${orderId}.`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${order.customer.phone}?text=${encodedMessage}`, '_blank');
        } else {
            alert(`No phone number available for order #${orderId}`);
        }
    }

    getDeliveryText(order) {
        if (!order.delivery) return 'Delivery';
        return order.delivery.method === 'pickup' ? 'Store Pickup' : 'Home Delivery';
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
                    <button class="btn btn-primary" onclick="adminManager.loadOrdersFromBackend()">
                        Refresh from Backend
                    </button>
                </td>
            </tr>
        `;
    }

    getNoResultsState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders match this filter</h3>
                    <p>Try selecting a different filter to see more orders.</p>
                    <button class="btn btn-primary" onclick="adminManager.setFilter('all')">
                        Show All Orders
                    </button>
                </td>
            </tr>
        `;
    }

    // Debug function to check orders
    debugOrders() {
        console.log('=== DEBUG ORDERS ===');
        console.log('Total orders:', this.orders.length);
        console.log('Orders data:', this.orders);
        console.log('Current filter:', this.currentFilter);
        console.log('Backend URL:', this.baseURL);
        console.log('Token exists:', !!this.token);
        
        alert(`Debug Info:\nTotal Orders: ${this.orders.length}\nCheck console for details.`);
    }

    // Load orders function for the refresh button
    async loadOrders() {
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
    }

    // Filter orders function for the filter buttons
    filterOrders(filter) {
        this.setFilter(filter);
    }

    // Update order status function for the modal
    async updateOrderStatus(orderId, newStatus) {
        await this.updateStatus(orderId, newStatus);
        document.getElementById('statusModal').style.display = 'none';
    }

    // Generate order details HTML for modal
    generateOrderDetailsHTML(order) {
        return `
            <div class="order-details">
                <h3>Order #${order.id}</h3>
                <div class="order-info">
                    <p><strong>Customer:</strong> ${order.customer?.name || 'N/A'}</p>
                    <p><strong>City:</strong> ${order.customer?.city || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.customer?.phone || 'Not provided'}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Delivery:</strong> ${this.getDeliveryText(order)}</p>
                    ${order.delivery?.pickupCode ? `<p><strong>Pickup Code:</strong> ${order.delivery.pickupCode}</p>` : ''}
                </div>
                <div class="order-items">
                    <h4>Items (${order.items?.length || 0})</h4>
                    ${order.items ? order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.img || 'https://via.placeholder.com/50'}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover;">
                            <div>
                                <strong>${item.title}</strong>
                                <p>${item.qty} × ${item.currency} ${item.price}</p>
                                ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                                ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                            </div>
                        </div>
                    `).join('') : 'No items'}
                </div>
                <div class="order-total">
                    <h3>Total: ${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}</h3>
                </div>
            </div>
        `;
    }
}

// Initialize admin manager
const adminManager = new AdminOrderManager();
