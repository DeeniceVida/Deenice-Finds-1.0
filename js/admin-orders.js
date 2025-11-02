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
            this.orders = data.orders || [];
            console.log('✅ Backend orders loaded:', this.orders.length);
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            alert('Failed to load orders. Please check your connection.');
            this.orders = [];
        }
    }

    async updateStatus(orderId, newStatus) {
        try {
            console.log('🔄 Updating order status:', orderId, newStatus);
            const response = await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            await this.loadOrdersFromBackend();
            this.renderStats();
            this.renderOrders();
            
            console.log('📱 Full server response:', response);
            console.log('📞 Customer phone:', response.order.customer?.phone);
            console.log('🔗 WhatsApp URL:', response.whatsappURL);
            
            // Show WhatsApp notification option
            if (response.whatsappURL) {
                console.log('✅ WhatsApp URL available, showing confirm dialog');
                const sendMsg = confirm(
                    `✅ Order #${orderId} updated to ${newStatus}!\n\n` +
                    `Customer: ${response.order.customer?.name || 'N/A'}\n` +
                    `Phone: ${response.order.customer?.phone || 'No phone'}\n\n` +
                    `Send WhatsApp notification to customer?`
                );
                
                if (sendMsg) {
                    console.log('🔄 Opening WhatsApp URL:', response.whatsappURL);
                    
                    // iOS-Compatible WhatsApp Opening
                    setTimeout(() => {
                        // Use window.location for better iOS compatibility
                        window.location.href = response.whatsappURL;
                    }, 100);
                    
                    // Fallback for blocked popups
                    setTimeout(() => {
                        if (window.location.href.indexOf('whatsapp') === -1) {
                            const manualOpen = confirm(
                                "WhatsApp didn't open automatically.\n\n" +
                                "Click OK to copy the WhatsApp link and open it manually."
                            );
                            if (manualOpen) {
                                navigator.clipboard.writeText(response.whatsappURL).then(() => {
                                    alert("📱 WhatsApp link copied! Please paste it in your browser to send the notification.");
                                });
                            }
                        }
                    }, 2000);
                }
            } else {
                console.log('❌ No WhatsApp URL in response');
                let alertMessage = `✅ Order #${orderId} updated to ${newStatus}!`;
                
                if (response.order.customer?.phone) {
                    alertMessage += `\n\n📞 Customer phone: ${response.order.customer.phone}`;
                    alertMessage += `\n❓ Phone available but no WhatsApp link was generated.`;
                    alertMessage += `\n🔍 Check server logs for details.`;
                } else {
                    alertMessage += `\n\n📞 No customer phone number provided.`;
                    alertMessage += `\n💡 Customers need to enter their WhatsApp number during checkout.`;
                }
                
                alert(alertMessage);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status: ' + error.message);
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
        const refreshBtn = document.getElementById('refreshOrders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadOrdersFromBackend();
                this.renderStats();
                this.renderOrders();
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
            `;
        }
    }

    renderOrders() {
        const container = document.getElementById('ordersList') || document.getElementById('orders-list');
        
        console.log('🎨 Rendering orders to container:', container);
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

        console.log('🖼️ Creating order cards...');
        container.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
        console.log('✅ Orders rendered successfully');
    }

    filterOrders() {
        if (this.currentFilter === 'all') {
            return this.orders;
        }
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    createOrderCard(order) {
        console.log('🛠️ Creating card for order:', order.id);
        
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id}</h3>
                        <div class="order-meta">
                            <span>📅 ${orderDate}</span>
                            <span>👤 ${order.customer?.name || 'N/A'}</span>
                            <span>📍 ${order.customer?.city || 'N/A'}</span>
                            <span>📞 ${order.customer?.phone || 'No phone'}</span>
                            <span>🚚 ${this.getDeliveryText(order)}</span>
                        </div>
                    </div>
                    <div>
                        <select class="status-select ${this.getStatusClass(order.status)}" 
                                onchange="adminManager.updateStatus('${order.id}', this.value)"
                                style="color: inherit;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <div class="order-items">
                    ${(order.items || []).map(item => this.createOrderItem(item)).join('')}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: ${order.currency || 'KES'} ${order.totalAmount?.toLocaleString() || '0'}
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-secondary" onclick="adminManager.viewOrderDetails('${order.id}')">
                            View Details
                        </button>
                        <button class="btn btn-primary" onclick="adminManager.contactCustomer('${order.id}')">
                            Contact Customer
                        </button>
                        <button class="btn btn-danger" onclick="adminManager.deleteOrder('${order.id}')" style="background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-left: 5px;">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createOrderItem(item) {
        const specs = [];
        if (item.color) specs.push(`Color: ${item.color}`);
        if (item.size) specs.push(`Size: ${item.size}`);
        if (item.model && item.model !== 'Standard') specs.push(`Model: ${item.model}`);

        return `
            <div class="order-item">
                <img src="${item.img || 'https://via.placeholder.com/50'}" 
                     alt="${item.title}" 
                     class="item-image">
                <div class="item-details">
                    <h4>${item.title || 'Unknown Item'}</h4>
                    ${specs.length > 0 ? `
                        <div class="item-specs">${specs.join(' • ')}</div>
                    ` : ''}
                    <div class="item-price">
                        ${item.qty || 1} × ${item.currency || 'KES'} ${(item.price || 0).toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }

    getDeliveryText(order) {
        if (!order.delivery) return 'Delivery';
        return order.delivery.method === 'pickup' ? 'Store Pickup' : 'Home Delivery';
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
        if (order) {
            const config = window.DEENICE_CONFIG || {};
            const whatsappNumber = config.whatsappNumber ? config.whatsappNumber.replace('+', '') : '';
            const message = `Hello ${order.customer?.name || 'there'}, this is Deenice Finds regarding your order #${orderId}.`;
            
            if (whatsappNumber) {
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
            } else {
                alert(`Contact customer for order #${orderId}\n\nMessage: ${message}`);
            }
        }
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <h3>No orders found</h3>
                <p>There are no orders in the system yet.</p>
                <button class="btn btn-primary" onclick="adminManager.loadOrdersFromBackend()">
                    Refresh from Backend
                </button>
            </div>
        `;
    }

    getNoResultsState() {
        return `
            <div class="empty-state">
                <h3>No orders match this filter</h3>
                <p>Try selecting a different filter to see more orders.</p>
                <button class="btn btn-primary" onclick="adminManager.setFilter('all')">
                    Show All Orders
                </button>
            </div>
        `;
    }
}

const adminManager = new AdminOrderManager();
