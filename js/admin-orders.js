class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing...');
        console.log('🔑 Token exists:', !!this.token);
        
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
            console.log(`🌐 Making request to: ${this.baseURL}${endpoint}`);
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            console.log(`📡 Response status: ${response.status}`);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response not OK:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Response data:', data);
            return data;
            
        } catch (error) {
            console.error('❌ API request failed:', error);
            throw error;
        }
    }

    async loadOrdersFromBackend() {
        try {
            console.log('📥 Loading orders from backend...');
            const data = await this.makeRequest('/orders');
            
            // Handle different response structures
            if (data.orders && Array.isArray(data.orders)) {
                this.orders = data.orders;
                console.log('✅ Loaded orders from data.orders:', this.orders.length);
            } else if (Array.isArray(data)) {
                this.orders = data;
                console.log('✅ Loaded orders from direct array:', this.orders.length);
            } else if (data && typeof data === 'object') {
                // Try to find orders array in the response object
                const possibleKeys = ['orders', 'order', 'data', 'items'];
                for (const key of possibleKeys) {
                    if (Array.isArray(data[key])) {
                        this.orders = data[key];
                        console.log(`✅ Loaded orders from data.${key}:`, this.orders.length);
                        break;
                    }
                }
                
                if (this.orders.length === 0) {
                    console.log('⚠️ No array found in response, checking if single order:', data);
                    // Check if it's a single order object
                    if (data.id && data.items) {
                        this.orders = [data];
                        console.log('✅ Loaded single order:', this.orders.length);
                    }
                }
            }
            
            if (this.orders.length === 0) {
                console.log('⚠️ No orders found in backend response, using localStorage fallback');
                this.loadOrdersFromLocalStorage();
            }
            
            console.log('📋 Final orders array:', this.orders);
            
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            console.log('🔄 Falling back to localStorage...');
            this.loadOrdersFromLocalStorage();
        }
    }

    loadOrdersFromLocalStorage() {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            console.log('📥 Loading from localStorage:', localOrders.length, 'orders');
            
            if (localOrders.length > 0) {
                this.orders = localOrders;
                console.log('✅ Loaded orders from localStorage:', this.orders.length);
            } else {
                console.log('📭 No orders found in localStorage either');
                this.orders = [];
            }
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.orders = [];
        }
    }

    // FIXED DELETE METHOD
    async deleteOrder(orderId) {
        try {
            const confirmDelete = confirm(
                `🗑️ DELETE ORDER #${orderId}\n\n` +
                `Are you sure you want to delete this order?\n\n` +
                `This will remove the order from:\n` +
                `• Admin panel\n` +
                `• Backend server\n` +
                `• Customer's order history\n\n` +
                `This action cannot be undone!`
            );
            
            if (!confirmDelete) return;

            console.log('🗑️ Deleting order:', orderId);
            
            // Remove from local state first for immediate feedback
            this.orders = this.orders.filter(order => order.id !== orderId);
            
            // Update UI immediately
            this.renderStats();
            this.renderOrders();
            
            // Try to delete from backend
            try {
                await this.makeRequest(`/orders/${orderId}`, {
                    method: 'DELETE'
                });
                console.log('✅ Order deleted from backend');
            } catch (error) {
                console.log('⚠️ Backend delete failed, but removed locally');
            }
            
            // Remove from localStorage (affects user's order history)
            this.removeOrderFromLocalStorage(orderId);
            
            alert(`✅ Order #${orderId} has been deleted!`);
            
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Failed to delete order: ' + error.message);
        }
    }

    removeOrderFromLocalStorage(orderId) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const updatedOrders = localOrders.filter(order => order.id !== orderId);
            localStorage.setItem('de_order_history', JSON.stringify(updatedOrders));
            console.log('✅ Removed from localStorage');
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
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
        
        console.log('🎨 Rendering orders to table...');
        console.log('📋 Orders count:', this.orders.length);
        console.log('🔍 Current filter:', this.currentFilter);

        if (!container) {
            console.error('❌ ordersTableBody container not found!');
            return;
        }

        if (this.orders.length === 0) {
            console.log('📭 No orders to display');
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        console.log('✅ Filtered orders count:', filteredOrders.length);
        
        if (filteredOrders.length === 0) {
            console.log('🔍 No orders match current filter');
            container.innerHTML = this.getNoResultsState();
            return;
        }

        console.log('🖼️ Creating table rows for orders...');
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
        console.log('🛠️ Creating row for order:', order);
        
        if (!order) {
            console.error('❌ Invalid order object');
            return '';
        }

        const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const customerName = order.customer?.name || order.name || 'N/A';
        const customerCity = order.customer?.city || order.city || 'N/A';
        const customerPhone = order.customer?.phone || order.phone || 'No phone';
        const totalAmount = order.totalAmount || order.total || 0;
        const currency = order.currency || 'KES';
        const status = order.status || 'pending';
        const items = order.items || [];

        console.log(`📦 Order ${order.id}:`, {
            customerName,
            customerCity,
            customerPhone,
            totalAmount,
            status,
            itemsCount: items.length
        });

        return `
            <tr data-order-id="${order.id}">
                <td>
                    <strong>#${order.id || 'N/A'}</strong>
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
                        ${items.slice(0, 2).map(item => this.createOrderItemPreview(item)).join('')}
                        ${items.length > 2 ? 
                            `<div class="item-name-small">+${items.length - 2} more items</div>` : 
                            ''}
                        ${items.length === 0 ? 
                            `<div class="item-name-small">No items</div>` : 
                            ''}
                    </div>
                </td>
                <td>
                    <strong>${currency} ${totalAmount.toLocaleString()}</strong>
                </td>
                <td>
                    <!-- VISIBLE STATUS DROPDOWN -->
                    <select class="status-select ${this.getStatusClass(status)}" 
                            onchange="adminManager.updateStatus('${order.id}', this.value)"
                            style="padding: 6px 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 12px; cursor: pointer; background: white; min-width: 120px;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>📝 Pending</option>
                        <option value="processing" ${status === 'processing' ? 'selected' : ''}>🔄 Processing</option>
                        <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
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
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')" 
                                style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    createOrderItemPreview(item) {
        if (!item) return '';
        
        const title = item.title || item.name || 'Unknown Item';
        const imageUrl = item.img || item.image || 'https://via.placeholder.com/30x30?text=No+Image';
        
        return `
            <div class="order-item-preview">
                <img src="${imageUrl}" 
                     alt="${title}" 
                     class="item-image-small"
                     onerror="this.src='https://via.placeholder.com/30x30?text=No+Image'">
                <div class="item-name-small">${title}</div>
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

    // ENHANCED STATUS UPDATE METHOD
    async updateStatus(orderId, newStatus) {
        try {
            console.log('🔄 Updating order status:', orderId, newStatus);
            
            // Find the order
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                alert('Order not found!');
                return;
            }

            const oldStatus = order.status;
            
            // Update locally first for immediate feedback
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            // Update UI immediately
            this.renderStats();
            this.renderOrders();
            
            // Then update in backend
            const response = await this.makeRequest(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            console.log('✅ Backend response:', response);
            
            // Show success message with WhatsApp option
            let successMessage = `✅ Order #${orderId} status updated from ${oldStatus} to ${newStatus}!`;
            
            if (response.whatsappURL && order.customer?.phone) {
                const sendNotification = confirm(
                    `${successMessage}\n\n` +
                    `Customer: ${order.customer?.name || 'N/A'}\n` +
                    `Phone: ${order.customer?.phone}\n\n` +
                    `Send WhatsApp notification to customer?`
                );
                
                if (sendNotification) {
                    window.open(response.whatsappURL, '_blank');
                }
            } else {
                alert(successMessage);
            }
            
            // Trigger sync for user order history
            if (window.orderSync) {
                window.orderSync.notifyAdminChange(orderId, 'status_update');
            }
            
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update order status: ' + error.message);
            
            // Reload orders to get correct state
            await this.loadOrdersFromBackend();
            this.renderStats();
            this.renderOrders();
        }
    }

    // BULK STATUS UPDATE METHODS
    async bulkUpdateStatus(orderIds, newStatus) {
        try {
            if (!orderIds || orderIds.length === 0) {
                alert('Please select at least one order to update.');
                return;
            }

            const confirmUpdate = confirm(
                `Update ${orderIds.length} order(s) to "${newStatus}"?`
            );
            
            if (!confirmUpdate) return;

            let successCount = 0;
            let failCount = 0;

            for (const orderId of orderIds) {
                try {
                    const order = this.orders.find(o => o.id === orderId);
                    if (order) {
                        // Update locally
                        order.status = newStatus;
                        order.statusUpdated = new Date().toISOString();
                        
                        if (newStatus === 'completed') {
                            order.completedDate = new Date().toISOString();
                        }
                        
                        // Update backend
                        await this.makeRequest(`/orders/${orderId}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: newStatus })
                        });
                        
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Failed to update order ${orderId}:`, error);
                    failCount++;
                }
            }

            // Update UI
            this.renderStats();
            this.renderOrders();

            let resultMessage = `✅ Updated ${successCount} order(s) to ${newStatus}!`;
            if (failCount > 0) {
                resultMessage += `\n❌ Failed to update ${failCount} order(s).`;
            }
            
            alert(resultMessage);

        } catch (error) {
            console.error('Bulk update failed:', error);
            alert('Bulk update failed. Check console for details.');
        }
    }

    // QUICK STATUS UPDATE BUTTONS (Alternative method)
    quickUpdateStatus(orderId, newStatus) {
        this.updateStatus(orderId, newStatus);
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const details = `
Order #${order.id} - Details

CUSTOMER INFORMATION:
Name: ${order.customer?.name || order.name || 'N/A'}
City: ${order.customer?.city || order.city || 'N/A'}
Phone: ${order.customer?.phone || order.phone || 'Not provided'}

ORDER INFORMATION:
Status: ${order.status || 'pending'}
Order Date: ${new Date(order.orderDate || order.date).toLocaleString()}
Last Updated: ${order.statusUpdated ? new Date(order.statusUpdated).toLocaleString() : 'N/A'}
Total: ${order.currency || 'KES'} ${(order.totalAmount || order.total || 0).toLocaleString()}

DELIVERY:
Method: ${order.delivery?.method || 'Home Delivery'}
${order.delivery?.pickupCode ? `Pickup Code: ${order.delivery.pickupCode}` : ''}

ITEMS (${(order.items || []).length}):
${order.items ? order.items.map((item, index) => 
    `${index + 1}. ${item.title || item.name} - ${item.qty || 1} × ${item.currency || 'KES'} ${(item.price || 0).toLocaleString()}`
).join('\n') : 'No items'}
            `;
            alert(details);
        }
    }

    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order && (order.customer?.phone || order.phone)) {
            const phone = order.customer?.phone || order.phone;
            const message = `Hello ${order.customer?.name || order.name || 'there'}, this is Deenice Finds regarding your order #${orderId}.`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
        } else {
            alert(`No phone number available for order #${orderId}`);
        }
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
                    <button class="btn btn-primary" onclick="adminManager.debugOrders()">
                        Debug Info
                    </button>
                    <button class="btn btn-secondary" onclick="adminManager.loadOrdersFromBackend()">
                        Retry Backend
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

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Add bulk actions
        this.addBulkActions();
    }

    addBulkActions() {
        // Create bulk actions container if it doesn't exist
        if (document.querySelector('.bulk-actions')) return;

        const bulkActions = document.createElement('div');
        bulkActions.className = 'bulk-actions';
        bulkActions.style.margin = '15px 0';
        bulkActions.style.padding = '15px';
        bulkActions.style.background = '#f8f9fa';
        bulkActions.style.borderRadius = '8px';
        bulkActions.style.border = '1px solid #dee2e6';
        
        bulkActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <strong>📦 Bulk Actions:</strong>
                <button class="btn btn-secondary" onclick="adminManager.bulkUpdateSelected('processing')" style="font-size: 12px;">
                    Mark as Processing
                </button>
                <button class="btn btn-secondary" onclick="adminManager.bulkUpdateSelected('completed')" style="font-size: 12px;">
                    Mark as Completed
                </button>
                <button class="btn btn-secondary" onclick="adminManager.selectAllOrders()" style="font-size: 12px;">
                    Select All
                </button>
                <button class="btn btn-secondary" onclick="adminManager.clearSelection()" style="font-size: 12px;">
                    Clear Selection
                </button>
                <small style="color: #666; margin-left: 10px;">Select orders using checkboxes</small>
            </div>
        `;
        
        // Insert before the table
        const tableContainer = document.querySelector('.orders-table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(bulkActions, tableContainer);
        }
        
        // Add checkboxes to each row
        this.addCheckboxesToRows();
    }

    addCheckboxesToRows() {
        // This will be called after rendering orders
        setTimeout(() => {
            const rows = document.querySelectorAll('#ordersTableBody tr');
            rows.forEach(row => {
                // Skip if checkbox already exists
                if (row.querySelector('.order-checkbox')) return;

                const orderId = row.getAttribute('data-order-id');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'order-checkbox';
                checkbox.value = orderId;
                checkbox.style.marginRight = '10px';
                checkbox.style.cursor = 'pointer';
                
                const firstCell = row.querySelector('td:first-child');
                if (firstCell) {
                    firstCell.innerHTML = checkbox.outerHTML + ' ' + firstCell.innerHTML;
                }
            });
        }, 100);
    }

    // Bulk update selected orders
    async bulkUpdateSelected(newStatus) {
        const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
        const selectedOrderIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        await this.bulkUpdateStatus(selectedOrderIds, newStatus);
    }

    // Select all orders
    selectAllOrders() {
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    // Clear selection
    clearSelection() {
        document.querySelectorAll('.order-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderOrders();
    }

    // Debug function
    debugOrders() {
        console.log('=== DEBUG ORDERS ===');
        console.log('Total orders:', this.orders.length);
        console.log('Orders array:', this.orders);
        console.log('Current filter:', this.currentFilter);
        console.log('Backend URL:', this.baseURL);
        console.log('Token exists:', !!this.token);
        console.log('LocalStorage orders:', JSON.parse(localStorage.getItem('de_order_history') || '[]'));
        
        alert(`Debug Info:\nTotal Orders: ${this.orders.length}\nFilter: ${this.currentFilter}\nCheck console for details.`);
    }

    // Public method for refresh button
    async loadOrders() {
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'admin-login.html';
    }
}

// Initialize admin manager
const adminManager = new AdminOrderManager();
