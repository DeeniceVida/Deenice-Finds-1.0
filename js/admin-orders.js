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
        
        if (!this.token || !this.isValidToken(this.token)) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Show loading state
        this.showLoadingState();
        
        await this.loadOrdersFromBackend();
        this.renderStats();
        this.renderOrders();
        this.setupEventListeners();
        this.startSyncMonitoring();
    }

    // Show loading state while data loads
    showLoadingState() {
        const statsGrid = document.getElementById('statsGrid');
        const ordersTable = document.getElementById('ordersTableBody');
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number stat-total">...</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-pending">...</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-processing">...</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-completed">...</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-cancelled">...</div>
                    <div>Loading...</div>
                </div>
            `;
        }
        
        if (ordersTable) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <div class="loading-spinner"></div>
                            <span>Loading orders...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Validate token structure
    isValidToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            const payload = JSON.parse(atob(parts[1]));
            return payload && payload.username && payload.role === 'admin';
        } catch (e) {
            console.error('Invalid token format:', e);
            return false;
        }
    }

    // Enhanced API request with better error handling
    async makeRequest(endpoint, options = {}) {
        try {
            console.log(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const config = {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            };

            if (options.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
                config.body = options.body;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            clearTimeout(timeoutId);

            console.log(`📡 Response: ${response.status} for ${endpoint}`);

            if (response.status === 401) {
                this.showNotification('Session expired. Please login again.', 'error');
                this.logout();
                throw new Error('Session expired');
            }

            if (!response.ok) {
                let errorData = { error: `HTTP ${response.status}` };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignore JSON parse errors
                }
                
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`❌ API Request Failed for ${endpoint}:`, error);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server is not responding');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error - check your internet connection');
            } else {
                throw error;
            }
        }
    }

    // FIXED: Load orders with proper error handling
    async loadOrdersFromBackend() {
        try {
            console.log('📥 Loading orders from backend...');
            const data = await this.makeRequest('/orders');
            
            // Handle different response structures
            if (data.orders && Array.isArray(data.orders)) {
                this.orders = data.orders;
                console.log('✅ Loaded orders from backend:', this.orders.length);
            } else if (Array.isArray(data)) {
                this.orders = data;
                console.log('✅ Loaded orders as direct array:', this.orders.length);
            } else {
                console.warn('⚠️ Unexpected response format:', data);
                this.orders = [];
            }
            
        } catch (error) {
            console.error('❌ Failed to load orders from backend:', error);
            this.showNotification('Backend unavailable. Using local data.', 'error');
            this.loadOrdersFromLocalStorage();
        }
    }

    // Load from localStorage as fallback
    loadOrdersFromLocalStorage() {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            if (localOrders.length > 0) {
                this.orders = localOrders;
                console.log('✅ Loaded orders from localStorage:', this.orders.length);
            } else {
                console.log('📭 No orders found anywhere');
                this.orders = [];
            }
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.orders = [];
        }
    }

    // FIXED: Status update with comprehensive error handling
    async updateStatus(orderId, newStatus) {
        try {
            console.log(`🔄 Updating order ${orderId} to ${newStatus}`);
            
            // 1. Find the order locally
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error(`Order ${orderId} not found locally`);
            }

            const oldStatus = order.status;
            
            // 2. Update locally first for immediate feedback
            order.status = newStatus;
            order.statusUpdated = new Date().toISOString();
            if (newStatus === 'completed') {
                order.completedDate = new Date().toISOString();
            }
            
            // 3. Update UI immediately
            this.renderStats();
            this.renderOrders();
            
            // 4. Try to update backend
            try {
                await this.makeRequest(`/orders/${orderId}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus })
                });
                console.log('✅ Backend update successful');
                
            } catch (backendError) {
                console.error('❌ Backend update failed:', backendError);
                
                // If it's a 404, the order might not exist on server
                if (backendError.message.includes('404') || backendError.message.includes('not found')) {
                    console.log('🔄 Order not found on server, attempting to create it...');
                    await this.createOrderOnServer(order);
                    
                    // Retry the status update
                    await this.makeRequest(`/orders/${orderId}/status`, {
                        method: 'PUT',
                        body: JSON.stringify({ status: newStatus })
                    });
                    console.log('✅ Order created and status updated on server');
                } else {
                    throw backendError;
                }
            }

            // 5. Update localStorage
            this.updateLocalStorageOrder(orderId, newStatus);
            
            // 6. Show success
            this.showNotification(
                `Order #${orderId} updated from ${oldStatus} to ${newStatus}`,
                'success'
            );
            
        } catch (error) {
            console.error('❌ Status update failed:', error);
            
            // Revert local changes if backend failed
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                // Keep the new status but mark as unsynced
                order.unsynced = true;
                this.renderOrders();
            }
            
            this.showNotification(
                `Update failed: ${error.message}. Changes saved locally.`,
                'error'
            );
        }
    }

    // Create order on server if it doesn't exist
    async createOrderOnServer(order) {
        try {
            console.log('🔄 Creating order on server:', order.id);
            
            const orderData = {
                id: order.id,
                customer: order.customer || {
                    name: order.name,
                    city: order.city,
                    phone: order.phone
                },
                items: order.items || [],
                totalAmount: order.totalAmount || order.total || 0,
                currency: order.currency || 'KES',
                orderDate: order.orderDate || new Date().toISOString(),
                status: order.status || 'pending',
                delivery: order.delivery || { method: 'home' }
            };

            await this.makeRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            
            console.log('✅ Order created on server');
            
        } catch (error) {
            console.error('❌ Failed to create order on server:', error);
            throw new Error('Could not create order on server: ' + error.message);
        }
    }

    // Update localStorage
    updateLocalStorageOrder(orderId, newStatus) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const orderIndex = localOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                localOrders[orderIndex].status = newStatus;
                localOrders[orderIndex].statusUpdated = new Date().toISOString();
                if (newStatus === 'completed') {
                    localOrders[orderIndex].completedDate = new Date().toISOString();
                }
                localStorage.setItem('de_order_history', JSON.stringify(localOrders));
            }
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // Delete order
    async deleteOrder(orderId) {
        if (!confirm(`Are you sure you want to delete order #${orderId}? This cannot be undone.`)) {
            return;
        }

        try {
            // Remove locally first
            this.orders = this.orders.filter(order => order.id !== orderId);
            this.renderStats();
            this.renderOrders();
            
            // Try to delete from backend
            try {
                await this.makeRequest(`/orders/${orderId}`, { method: 'DELETE' });
            } catch (error) {
                console.log('⚠️ Backend delete failed, but removed locally');
            }
            
            // Remove from localStorage
            this.removeOrderFromLocalStorage(orderId);
            
            this.showNotification(`Order #${orderId} deleted`, 'success');
            
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    removeOrderFromLocalStorage(orderId) {
        try {
            const localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const updatedOrders = localOrders.filter(order => order.id !== orderId);
            localStorage.setItem('de_order_history', JSON.stringify(updatedOrders));
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Enhanced notification system
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
            max-width: 400px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#FF3B30' : '#007AFF'};
            word-break: break-word;
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

    // Render statistics
    renderStats() {
        const stats = {
            total: this.orders.length,
            pending: this.orders.filter(o => o.status === 'pending').length,
            processing: this.orders.filter(o => o.status === 'processing').length,
            completed: this.orders.filter(o => o.status === 'completed').length,
            cancelled: this.orders.filter(o => o.status === 'cancelled').length
        };

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
        if (!container) {
            console.error('❌ ordersTableBody container not found!');
            return;
        }

        if (this.orders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        const filteredOrders = this.filterOrders();
        if (filteredOrders.length === 0) {
            container.innerHTML = this.getNoResultsState();
            return;
        }

        container.innerHTML = filteredOrders.map(order => this.createOrderRow(order)).join('');
    }

    createOrderRow(order) {
    const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleDateString();
    const customerName = order.customer?.name || order.name || 'N/A';
    const customerCity = order.customer?.city || order.city || 'N/A';
    const customerPhone = order.customer?.phone || order.phone || 'No phone';
    const totalAmount = order.totalAmount || order.total || 0;
    const currency = order.currency || 'KES';
    const status = order.status || 'pending';
    const items = order.items || [];

    return `
        <tr data-order-id="${order.id}">
            <td><strong>#${order.id}</strong></td>
            <td>
                <div class="customer-info">
                    <div class="customer-name">${customerName}</div>
                    <div class="customer-city">${customerCity}</div>
                    <div class="customer-phone">📞 ${customerPhone}</div>
                </div>
            </td>
            <td>${orderDate}</td>
            <td>
                <div class="order-items-preview">
                    ${items.slice(0, 3).map(item => this.createOrderItemPreview(item)).join('')}
                    ${items.length > 3 ? `<div class="item-name-small">+${items.length - 3} more items</div>` : ''}
                    ${items.length === 0 ? `<div class="item-name-small">No items</div>` : ''}
                </div>
            </td>
            <td><strong>${currency} ${totalAmount.toLocaleString()}</strong></td>
            <td>
                <select class="status-select ${this.getStatusClass(status)}" 
                        onchange="adminManager.updateStatus('${order.id}', this.value)"
                        style="padding: 6px 10px; border-radius: 6px; border: 1px solid #ddd; font-size: 12px; cursor: pointer; background: white; min-width: 120px;">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>📝 Pending</option>
                    <option value="processing" ${status === 'processing' ? 'selected' : ''}>🔄 Processing</option>
                    <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                    <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                </select>
                ${order.unsynced ? '<br><small style="color: orange;">⚠️ Not synced</small>' : ''}
            </td>
            <td>
                <div class="actions">
                    <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">View</button>
                    <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">Contact</button>
                    <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `;
}

createOrderItemPreview(item) {
    if (!item) return '';
    
    const title = item.title || item.name || 'Unknown Item';
    const imageUrl = item.img || item.image || item.thumbnail || 
                    'https://via.placeholder.com/40x40/CCCCCC/666666?text=No+Image';
    const qty = item.qty || 1;
    
    return `
        <div class="order-item-preview">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 class="item-image-small"
                 onerror="this.src='https://via.placeholder.com/40x40/CCCCCC/666666?text=No+Image'">
            <div class="item-details-small">
                <div class="item-name-small">${title}</div>
                <div class="item-qty-small">Qty: ${qty}</div>
            </div>
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

    filterOrders() {
        if (this.currentFilter === 'all') return this.orders;
        return this.orders.filter(order => order.status === this.currentFilter);
    }

    getEmptyState() {
        return `
            <tr>
                <td colspan="7" class="empty-state">
                    <h3>No orders found</h3>
                    <p>There are no orders in the system yet.</p>
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
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderOrders();
    }

    startSyncMonitoring() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadOrdersFromBackend().then(() => {
                this.renderStats();
                this.renderOrders();
            });
        }, 30000);
    }

    logout() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'admin-login.html';
    }

    // Enhanced order details with phone number and complete information
    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const customerName = order.customer?.name || order.name || 'N/A';
            const customerCity = order.customer?.city || order.city || 'N/A';
            const customerPhone = order.customer?.phone || order.phone || 'Not provided';
            const customerEmail = order.customer?.email || order.email || 'Not provided';
            
            const orderDate = new Date(order.orderDate || order.date).toLocaleString();
            const statusUpdated = order.statusUpdated ? new Date(order.statusUpdated).toLocaleString() : 'N/A';
            const totalAmount = order.totalAmount || order.total || 0;
            const currency = order.currency || 'KES';
            
            const deliveryMethod = order.delivery?.method || 'Home Delivery';
            const pickupCode = order.delivery?.pickupCode || 'N/A';
            const deliveryAddress = order.delivery?.address || 'Not specified';
            
            const items = order.items || [];
            
            let details = `
ORDER #${order.id} - DETAILS

📋 CUSTOMER INFORMATION:
├── Name: ${customerName}
├── City: ${customerCity}
├── Phone: ${customerPhone}
└── Email: ${customerEmail}

📦 ORDER INFORMATION:
├── Status: ${order.status.toUpperCase()}
├── Order Date: ${orderDate}
├── Last Updated: ${statusUpdated}
├── Total: ${currency} ${totalAmount.toLocaleString()}
└── Delivery: ${deliveryMethod}
   ${deliveryMethod === 'pickup' ? `├── Pickup Code: ${pickupCode}` : `├── Address: ${deliveryAddress}`}

🛍️ ITEMS (${items.length}):
`;

            if (items.length > 0) {
                items.forEach((item, index) => {
                    const itemName = item.title || item.name || 'Unknown Item';
                    const itemPrice = item.price || 0;
                    const itemQty = item.qty || 1;
                    const itemTotal = itemPrice * itemQty;
                    const itemCurrency = item.currency || 'KES';
                    
                    details += `\n${index + 1}. ${itemName}
   ├── Quantity: ${itemQty}
   ├── Price: ${itemCurrency} ${itemPrice.toLocaleString()}
   └── Total: ${itemCurrency} ${itemTotal.toLocaleString()}`;
                    
                    // Show color/model if available
                    if (item.color) details += `\n   ├── Color: ${item.color}`;
                    if (item.model) details += `\n   ├── Model: ${item.model}`;
                    if (item.size) details += `\n   ├── Size: ${item.size}`;
                });
                
                // Calculate subtotal
                const subtotal = items.reduce((sum, item) => {
                    return sum + ((item.price || 0) * (item.qty || 1));
                }, 0);
                
                details += `\n\n💰 ORDER SUMMARY:
├── Subtotal: ${currency} ${subtotal.toLocaleString()}
├── Delivery: ${currency} 0
└── TOTAL: ${currency} ${totalAmount.toLocaleString()}`;
                
            } else {
                details += '\nNo items in this order';
            }

            // Add quick actions
            details += `\n\n⚡ QUICK ACTIONS:
• Click "Contact" to message customer on WhatsApp
• Use dropdown to change order status
• Click "Delete" to remove this order`;

            alert(details);
        } else {
            alert(`Order #${orderId} not found!`);
        }
    }

    // Enhanced contact customer with better phone number handling
    contactCustomer(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            // Try multiple possible phone number locations
            const phone = order.customer?.phone || 
                         order.phone || 
                         order.customer?.mobile || 
                         order.mobile;
            
            const customerName = order.customer?.name || order.name || 'there';
            
            if (phone) {
                const cleanPhone = phone.replace(/\D/g, '');
                
                // Check if phone number looks valid (at least 9 digits)
                if (cleanPhone.length >= 9) {
                    const message = `Hello ${customerName}, this is Deenice Finds regarding your order #${orderId}. How can we assist you today?`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
                    
                    console.log('📱 Contacting customer:', {
                        orderId: orderId,
                        customerName: customerName,
                        phone: phone,
                        cleanPhone: cleanPhone
                    });
                    
                    this.openWhatsAppURL(whatsappURL);
                } else {
                    alert(`Phone number for order #${orderId} appears invalid: ${phone}`);
                }
            } else {
                // Show detailed info about what phone fields were checked
                console.log('🔍 Phone number search failed for order:', {
                    orderId: orderId,
                    customerPhone: order.customer?.phone,
                    orderPhone: order.phone,
                    customerMobile: order.customer?.mobile,
                    orderMobile: order.mobile
                });
                
                alert(`No valid phone number found for order #${orderId}\n\nAvailable contact info:\n• Name: ${customerName}\n• Check browser console for details.`);
            }
        } else {
            alert(`Order #${orderId} not found!`);
        }
    }

    // Mobile-friendly WhatsApp URL opening
    openWhatsAppURL(url) {
        try {
            // Try to open in new window
            const newWindow = window.open(url, '_blank');
            
            // If blocked (common on mobile), fallback to direct navigation
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                console.log('Popup blocked, using direct navigation');
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            // Final fallback - show URL for manual copy
            const manualSend = confirm(
                "WhatsApp didn't open automatically.\n\n" +
                "Click OK to copy the WhatsApp link and open it manually."
            );
            if (manualSend) {
                navigator.clipboard.writeText(url).then(() => {
                    alert("📱 WhatsApp link copied! Please paste it in your browser.");
                }).catch(() => {
                    // Fallback for older browsers
                    prompt("Copy this WhatsApp link:", url);
                });
            }
        }
    }
}

// Initialize the single admin manager
const adminManager = new AdminOrderManager();
