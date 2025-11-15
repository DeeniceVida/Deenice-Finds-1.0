class AdminOrderManager {
    constructor() {
        this.orders = [];
        this.currentFilter = 'all';
        this.baseURL = 'https://deenice-finds-1-0-1.onrender.com/api';
        this.token = localStorage.getItem('admin_token');
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('🔄 AdminOrderManager initializing...');
        
        if (!this.token || !this.isValidToken(this.token)) {
            window.location.href = 'admin-login.html';
            return;
        }
        
        // Setup session persistence FIRST
        this.setupSessionPersistence();
        
        // Setup data recovery
        this.recoverOrderData();
        
        // Show loading state
        this.showLoadingState();
        
        // Load from localStorage FIRST (instant display)
        this.loadOrdersFromLocalStorage();
        this.renderStats();
        this.renderOrders();
        
        // Then try to sync with backend in background
        this.syncWithBackend();
        
        this.setupEventListeners();
        this.createItemsModal();
        
        console.log('✅ AdminOrderManager initialized');
    }

    // NEW: Session persistence setup
    setupSessionPersistence() {
        console.log('💾 Setting up session persistence...');
        
        // Backup orders when admin updates them
        const originalUpdateStatus = this.updateStatus.bind(this);
        this.updateStatus = async function(orderId, newStatus) {
            await originalUpdateStatus(orderId, newStatus);
            // Backup the updated orders
            if (this.orders.length > 0) {
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('💾 Orders backed up after status update');
            }
        };

        // Backup on delete
        const originalDeleteOrder = this.deleteOrder.bind(this);
        this.deleteOrder = async function(orderId) {
            await originalDeleteOrder(orderId);
            // Backup after deletion
            if (this.orders.length > 0) {
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('💾 Orders backed up after deletion');
            }
        };

        // Backup before page unload
        window.addEventListener('beforeunload', () => {
            if (this.orders.length > 0) {
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('💾 Orders backed up before page unload');
            }
        });

        // Backup periodically (every 2 minutes)
        setInterval(() => {
            if (this.orders.length > 0) {
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('💾 Periodic backup completed');
            }
        }, 120000);

        console.log('✅ Session persistence setup complete');
    }

    // NEW: Data recovery on initialization
    recoverOrderData() {
        console.log('🔄 Checking for data recovery...');
        
        const mainOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        const backupOrders = JSON.parse(localStorage.getItem('de_order_history_backup') || '[]');
        
        console.log('📊 Storage status:', {
            mainOrders: mainOrders.length,
            backupOrders: backupOrders.length
        });
        
        // If main storage is empty but backup has data, restore it
        if (mainOrders.length === 0 && backupOrders.length > 0) {
            console.log('🚨 Data loss detected! Restoring from backup...');
            localStorage.setItem('de_order_history', JSON.stringify(backupOrders));
            this.showNotification('📦 Orders recovered from backup!', 'success');
            console.log('✅ Orders recovered from backup:', backupOrders.length);
            return true;
        }
        
        // If both have data but backup is newer (based on latest order date)
        if (mainOrders.length > 0 && backupOrders.length > 0) {
            const mainLatest = this.getLatestOrderDate(mainOrders);
            const backupLatest = this.getLatestOrderDate(backupOrders);
            
            if (backupLatest > mainLatest) {
                console.log('🔄 Backup has newer data, restoring...');
                localStorage.setItem('de_order_history', JSON.stringify(backupOrders));
                this.showNotification('📦 Newer orders restored from backup!', 'success');
                return true;
            }
        }
        
        console.log('✅ No data recovery needed');
        return false;
    }

    // NEW: Helper to get latest order date
    getLatestOrderDate(orders) {
        if (!orders || orders.length === 0) return new Date(0);
        
        return new Date(Math.max(...orders.map(order => 
            new Date(order.statusUpdated || order.orderDate || order.date || 0).getTime()
        )));
    }

    // ENHANCED: Load orders with recovery fallback
    loadOrdersFromLocalStorage() {
        try {
            // First try main storage
            let localOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            
            // If empty, try backup
            if (localOrders.length === 0) {
                console.log('📭 No orders in main storage, checking backup...');
                localOrders = JSON.parse(localStorage.getItem('de_order_history_backup') || '[]');
                
                if (localOrders.length > 0) {
                    // Restore from backup to main storage
                    localStorage.setItem('de_order_history', JSON.stringify(localOrders));
                    console.log('✅ Restored orders from backup:', localOrders.length);
                    this.showNotification('Orders recovered from backup!', 'success');
                }
            }
            
            if (localOrders.length > 0) {
                this.orders = localOrders;
                console.log('✅ Loaded orders from storage:', this.orders.length);
            } else {
                console.log('📭 No orders found in any storage');
                this.orders = [];
            }
        } catch (error) {
            console.error('❌ Error loading from storage:', error);
            this.orders = [];
        }
    }

    // Background sync with backend
    async syncWithBackend() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            console.log('🔄 Syncing with backend...');
            const data = await this.makeRequest('/orders');
            
            if (data.orders && Array.isArray(data.orders)) {
                this.orders = data.orders;
                // Update localStorage with fresh data
                localStorage.setItem('de_order_history', JSON.stringify(this.orders));
                // Also update backup
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('✅ Synced with backend:', this.orders.length, 'orders');
            } else if (Array.isArray(data)) {
                this.orders = data;
                localStorage.setItem('de_order_history', JSON.stringify(this.orders));
                localStorage.setItem('de_order_history_backup', JSON.stringify(this.orders));
                console.log('✅ Synced with backend (direct array):', this.orders.length, 'orders');
            }
            
            this.renderStats();
            this.renderOrders();
            
        } catch (error) {
            console.error('❌ Backend sync failed:', error);
            // Don't show error if we have local data
            if (this.orders.length === 0) {
                this.showNotification('Using local data. Backend unavailable.', 'error');
            }
        } finally {
            this.isLoading = false;
        }
    }

    // NEW: Sync status changes to client
    async syncStatusToClient(orderId, newStatus) {
        try {
            console.log(`🔄 Syncing status to client: ${orderId} -> ${newStatus}`);
            
            // Method 1: Update localStorage directly (immediate)
            this.updateClientLocalStorage(orderId, newStatus);
            
            // Method 2: Trigger sync event for order-sync.js
            this.triggerClientSyncEvent(orderId, newStatus);
            
            // Method 3: Update sync markers for real-time detection
            this.updateSyncMarkers(orderId, newStatus);
            
            console.log('✅ Status change synced to client');
            
        } catch (error) {
            console.error('❌ Failed to sync status to client:', error);
        }
    }

    // Update client's localStorage directly
    updateClientLocalStorage(orderId, newStatus) {
        try {
            const clientOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const orderIndex = clientOrders.findIndex(order => order.id === orderId);
            
            if (orderIndex > -1) {
                clientOrders[orderIndex].status = newStatus;
                clientOrders[orderIndex].statusUpdated = new Date().toISOString();
                if (newStatus === 'completed') {
                    clientOrders[orderIndex].completedDate = new Date().toISOString();
                }
                
                localStorage.setItem('de_order_history', JSON.stringify(clientOrders));
                console.log('✅ Updated client localStorage for order:', orderId);
            } else {
                console.log('⚠️ Order not found in client localStorage, may need full sync');
            }
        } catch (error) {
            console.error('Error updating client localStorage:', error);
        }
    }

    // Trigger events for order-sync.js to detect
    triggerClientSyncEvent(orderId, newStatus) {
        // Custom event that order-sync.js can listen for
        const statusEvent = new CustomEvent('adminOrderUpdate', {
            detail: {
                orderId: orderId,
                newStatus: newStatus,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(statusEvent);
        
        // Also trigger storage event (simulates localStorage change)
        const syncEvent = new Event('storage');
        syncEvent.key = 'de_order_sync_markers';
        window.dispatchEvent(syncEvent);
        
        console.log('📢 Triggered client sync events for order:', orderId);
    }

    // Update sync markers for real-time detection
    updateSyncMarkers(orderId, newStatus) {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            markers[orderId] = {
                status: newStatus,
                updated: new Date().toISOString(),
                source: 'admin'
            };
            localStorage.setItem('de_order_sync_markers', JSON.stringify(markers));
            console.log('📝 Updated sync markers for order:', orderId);
        } catch (error) {
            console.error('Error updating sync markers:', error);
        }
    }

    // NEW: Enhanced status update with client sync
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
            
            // 4. Sync to client immediately (NEW)
            await this.syncStatusToClient(orderId, newStatus);
            
            // 5. Try to update backend
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

            // 6. Update localStorage and backup
            this.updateLocalStorageOrder(orderId, newStatus);
            
            // 7. Show success
            this.showNotification(
                `Order #${orderId} updated from ${oldStatus} to ${newStatus} - Client notified`,
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

    // Update localStorage and backup
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
                
                // Update both main storage and backup
                localStorage.setItem('de_order_history', JSON.stringify(localOrders));
                localStorage.setItem('de_order_history_backup', JSON.stringify(localOrders));
            }
        } catch (error) {
            console.error('Error updating localStorage:', error);
        }
    }

    // Optimized API request with shorter timeout
    async makeRequest(endpoint, options = {}) {
        try {
            console.log(`🌐 API Call: ${options.method || 'GET'} ${endpoint}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced from 15s to 8s
            
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
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error(`❌ API Request Failed:`, error);
            throw error;
        }
    }

    // Show loading state
    showLoadingState() {
        const statsGrid = document.getElementById('statsGrid');
        const ordersTable = document.getElementById('ordersTableBody');
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number stat-total">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-pending">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-processing">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-completed">--</div>
                    <div>Loading...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number stat-cancelled">--</div>
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
                            <span>Loading orders from cache...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Create the items modal HTML
    createItemsModal() {
        if (document.getElementById('itemsModal')) return;

        const modalHTML = `
            <div id="itemsModal" class="modal" style="display: none;">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    margin: 50px auto;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Order Items</h3>
                        <button onclick="adminManager.closeItemsModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5em;
                            cursor: pointer;
                            color: #666;
                            padding: 5px;
                        ">×</button>
                    </div>
                    <div id="itemsModalContent"></div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button onclick="adminManager.closeItemsModal()" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
            
            // Remove from localStorage and update backup
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
            
            // Update both main storage and backup
            localStorage.setItem('de_order_history', JSON.stringify(updatedOrders));
            localStorage.setItem('de_order_history_backup', JSON.stringify(updatedOrders));
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
                        <button class="view-btn" onclick="adminManager.viewOrderDetails('${order.id}')">Details</button>
                        <button class="view-btn items-btn" onclick="adminManager.viewOrderItems('${order.id}')">Items</button>
                        <button class="edit-btn" onclick="adminManager.contactCustomer('${order.id}')">Contact</button>
                        
                        <!-- PRINT BUTTONS -->
                        <button class="print-btn" onclick="adminManager.printShippingLabel('${order.id}')" 
                                style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin: 2px; display: block; width: 100%;">
                            🖨️ Print Label
                        </button>
                        <button class="preview-btn" onclick="adminManager.previewShippingLabel('${order.id}')" 
                                style="background: #6f42c1; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin: 2px; display: block; width: 100%;">
                            👀 Preview Label
                        </button>
                        
                        <button class="btn-danger" onclick="adminManager.deleteOrder('${order.id}')" style="margin-top: 5px;">Delete</button>
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
                    <button class="btn btn-primary" onclick="adminManager.emergencyRecovery()">
                        🔄 Try Emergency Recovery
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

    // NEW: Emergency recovery function
    emergencyRecovery() {
        console.log('🚨 Manual emergency recovery triggered');
        const recovered = this.recoverOrderData();
        if (recovered) {
            this.loadOrdersFromLocalStorage();
            this.renderStats();
            this.renderOrders();
            this.showNotification('Emergency recovery completed!', 'success');
        } else {
            this.showNotification('No backup data found for recovery.', 'error');
        }
    }

    // Manual refresh method
    async loadOrders() {
        this.showLoadingState();
        await this.syncWithBackend();
    }

    // FIXED: Enhanced order details with phone number and complete information
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

            // Use a modal instead of alert for better UX
            this.showOrderDetailsModal(details, orderId);
        } else {
            alert(`Order #${orderId} not found!`);
        }
    }

    // Show order details in a modal instead of alert
    showOrderDetailsModal(details, orderId) {
        // Remove existing modal if any
        const existingModal = document.getElementById('orderDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="orderDetailsModal" class="modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Order #${orderId} Details</h3>
                        <button onclick="adminManager.closeOrderDetailsModal()" style="
                            background: none;
                            border: none;
                            font-size: 1.5em;
                            cursor: pointer;
                            color: #666;
                            padding: 5px;
                        ">×</button>
                    </div>
                    <pre style="
                        white-space: pre-wrap;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        line-height: 1.4;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        overflow-x: auto;
                    ">${details}</pre>
                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="adminManager.closeOrderDetailsModal()" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Close order details modal
    closeOrderDetailsModal() {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            modal.remove();
        }
    }

    // Show items in modal with images
    viewOrderItems(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const items = order.items || [];
        const modalContent = document.getElementById('itemsModalContent');
        
        if (!modalContent) {
            console.error('❌ Items modal content not found');
            return;
        }

        if (items.length === 0) {
            modalContent.innerHTML = '<p>No items in this order.</p>';
        } else {
            modalContent.innerHTML = items.map((item, index) => {
                const title = item.title || item.name || 'Unknown Item';
                const imageUrl = item.img || item.image || item.thumbnail || 
                               'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';
                const price = item.price || 0;
                const qty = item.qty || 1;
                const total = price * qty;
                const currency = item.currency || 'KES';
                
                return `
                    <div class="order-item-modal" style="
                        display: flex;
                        gap: 15px;
                        padding: 15px;
                        border: 1px solid #e5e5e7;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        background: #f8f9fa;
                    ">
                        <img src="${imageUrl}" 
                             alt="${title}"
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;"
                             onerror="this.src='https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image'">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                            <div style="font-size: 0.9em; color: #666;">
                                <div>Quantity: ${qty}</div>
                                <div>Price: ${currency} ${price.toLocaleString()}</div>
                                <div style="font-weight: bold; color: #333;">Total: ${currency} ${total.toLocaleString()}</div>
                                ${item.color ? `<div>Color: ${item.color}</div>` : ''}
                                ${item.size ? `<div>Size: ${item.size}</div>` : ''}
                                ${item.model ? `<div>Model: ${item.model}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const modal = document.getElementById('itemsModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Close items modal - FIXED
    closeItemsModal() {
        const modal = document.getElementById('itemsModal');
        if (modal) {
            modal.style.display = 'none';
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

    // Print shipping label
    printShippingLabel(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            if (typeof labelPrinter !== 'undefined') {
                labelPrinter.printLabel(order);
                this.showNotification(`Opening print dialog for order #${orderId}`, 'success');
            } else {
                this.showNotification('Label printer not loaded.', 'error');
            }
        } else {
            this.showNotification(`Order #${orderId} not found!`, 'error');
        }
    }

    // Preview label
    previewShippingLabel(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            if (typeof labelPrinter !== 'undefined') {
                labelPrinter.previewLabel(order);
            } else {
                this.showNotification('Label printer not loaded.', 'error');
            }
        } else {
            this.showNotification(`Order #${orderId} not found!`, 'error');
        }
    }

    logout() {
        // Backup current orders before logout
        const currentOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        if (currentOrders.length > 0) {
            localStorage.setItem('de_order_history_backup', JSON.stringify(currentOrders));
            console.log('💾 Orders backed up before logout');
        }
        
        // Clear session but preserve backup
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
        // DON'T remove de_order_history or de_order_history_backup here
        
        window.location.href = 'admin-login.html';
    }

    // NEW: Debug function to check storage status
    debugOrders() {
        const mainOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        const backupOrders = JSON.parse(localStorage.getItem('de_order_history_backup') || '[]');
        const memoryOrders = this.orders;
        
        const debugInfo = `
🔍 DEBUG ORDER STORAGE:

📋 Memory (Current): ${memoryOrders.length} orders
📦 LocalStorage: ${mainOrders.length} orders  
💾 Backup: ${backupOrders.length} orders

🆔 Memory Order IDs: ${memoryOrders.map(o => o.id).join(', ') || 'None'}
🆔 LocalStorage Order IDs: ${mainOrders.map(o => o.id).join(', ') || 'None'}
🆔 Backup Order IDs: ${backupOrders.map(o => o.id).join(', ') || 'None'}

💡 Status:
${mainOrders.length === 0 && backupOrders.length > 0 ? '🚨 DATA LOSS DETECTED - Backup available for recovery' : '✅ Storage OK'}
${memoryOrders.length !== mainOrders.length ? '⚠️ Memory/LocalStorage mismatch' : '✅ Memory/LocalStorage sync OK'}

🔄 Client Sync Status: ${this.testClientSync()}
        `.trim();

        console.log(debugInfo);
        alert(debugInfo);
        
        return {
            memory: memoryOrders.length,
            localStorage: mainOrders.length,
            backup: backupOrders.length,
            needsRecovery: mainOrders.length === 0 && backupOrders.length > 0
        };
    }

    // NEW: Test client sync functionality
    testClientSync() {
        try {
            const markers = JSON.parse(localStorage.getItem('de_order_sync_markers') || '{}');
            const clientOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            
            return `Markers: ${Object.keys(markers).length}, Client Orders: ${clientOrders.length}`;
        } catch (error) {
            return 'Error checking sync status';
        }
    }

    // NEW: Force sync all orders to client
    async forceSyncToClient() {
        try {
            console.log('🔄 Forcing sync of all orders to client...');
            
            // Update client localStorage with current admin orders
            localStorage.setItem('de_order_history', JSON.stringify(this.orders));
            
            // Create sync markers for all orders
            const markers = {};
            this.orders.forEach(order => {
                markers[order.id] = {
                    status: order.status,
                    updated: order.statusUpdated || new Date().toISOString(),
                    source: 'admin_force_sync'
                };
            });
            localStorage.setItem('de_order_sync_markers', JSON.stringify(markers));
            
            // Trigger sync event
            const syncEvent = new Event('storage');
            syncEvent.key = 'de_order_sync_markers';
            window.dispatchEvent(syncEvent);
            
            this.showNotification(`Synced ${this.orders.length} orders to client`, 'success');
            console.log('✅ Force sync to client completed');
            
        } catch (error) {
            console.error('❌ Force sync to client failed:', error);
            this.showNotification('Failed to sync to client', 'error');
        }
    }
}

// Initialize the single admin manager
const adminManager = new AdminOrderManager();

// Add global close functions for modal buttons
window.closeItemsModal = function() {
    if (typeof adminManager !== 'undefined') {
        adminManager.closeItemsModal();
    }
};

window.closeOrderDetailsModal = function() {
    if (typeof adminManager !== 'undefined') {
        adminManager.closeOrderDetailsModal();
    }
};

// NEW: Global emergency recovery function
window.emergencyRecovery = function() {
    if (typeof adminManager !== 'undefined') {
        adminManager.emergencyRecovery();
    }
};

// NEW: Global force sync function
window.forceSyncToClient = function() {
    if (typeof adminManager !== 'undefined') {
        adminManager.forceSyncToClient();
    }
};

// NEW: Test function for development
window.testStatusSync = function() {
    const testOrderId = prompt('Enter order ID to test status sync:');
    if (testOrderId) {
        const newStatus = prompt('Enter new status (pending/processing/completed/cancelled):');
        if (newStatus) {
            // Simulate admin update
            const event = new CustomEvent('adminOrderUpdate', {
                detail: {
                    orderId: testOrderId,
                    newStatus: newStatus,
                    timestamp: new Date().toISOString()
                }
            });
            window.dispatchEvent(event);
            alert(`Test update sent: ${testOrderId} -> ${newStatus}`);
        }
    }
};
