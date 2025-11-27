// js/progress-tracker.js - NEW CARD-BASED PROGRESS TRACKING SYSTEM
class ProgressTracker {
    constructor() {
        this.progressSteps = [
            { 
                id: 'ordered', 
                name: 'Ordered', 
                description: 'Order received and confirmed' 
            },
            { 
                id: 'preparing', 
                name: 'Preparing', 
                description: 'Processing your order' 
            },
            { 
                id: 'shipped', 
                name: 'Shipped', 
                description: 'Item is on its way' 
            },
            { 
                id: 'delivered', 
                name: 'Delivered', 
                description: 'Order completed' 
            }
        ];
    }

    // Check if order is Buy For Me type
    isBuyForMeOrder(order) {
        return order.type === 'buy-for-me' || 
               (order.items && order.items.some(item => item.link)) ||
               (order.source && order.source === 'buy-for-me') ||
               (order.id && order.id.startsWith('BFM'));
    }

    // Get progress step by status
    getStepByStatus(status) {
        const stepMap = {
            'pending': 'ordered',
            'processing': 'preparing',
            'sourcing': 'preparing',
            'quality_check': 'preparing',
            'shipping_preparation': 'preparing',
            'shipped': 'shipped',
            'completed': 'delivered',
            'cancelled': 'ordered'
        };
        
        return stepMap[status] || 'ordered';
    }

    // Get current step index
    getCurrentStepIndex(status) {
        const currentStep = this.getStepByStatus(status);
        return this.progressSteps.findIndex(step => step.id === currentStep);
    }

    // Format date for step description
    formatStepDate(order, stepId) {
        const orderDate = new Date(order.orderDate || order.date);
        
        const dateMap = {
            'ordered': orderDate,
            'preparing': orderDate,
            'shipped': new Date(orderDate.getTime() + (2 * 24 * 60 * 60 * 1000)), // +2 days
            'delivered': new Date(orderDate.getTime() + (5 * 24 * 60 * 60 * 1000)) // +5 days
        };
        
        const date = dateMap[stepId] || orderDate;
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    // Generate product image URL
    getProductImage(order) {
        if (order.items && order.items[0]) {
            return order.items[0].img || 
                   order.items[0].image || 
                   order.items[0].thumbnail || 
                   'https://via.placeholder.com/120x120/CCCCCC/666666?text=Product+Image';
        }
        return 'https://via.placeholder.com/120x120/CCCCCC/666666?text=Product+Image';
    }

    // Generate product title
    getProductTitle(order) {
        if (order.items && order.items[0]) {
            return order.items[0].title || 
                   order.items[0].name || 
                   'Buy For Me Product';
        }
        return 'Buy For Me Product';
    }

    // Generate NEW CARD-BASED progress bar HTML
    generateProgressBar(order) {
        if (!this.isBuyForMeOrder(order)) {
            return ''; // Return empty string for non-Buy For Me orders
        }

        const currentStepIndex = this.getCurrentStepIndex(order.status);
        const isCancelled = order.status === 'cancelled';
        const productImage = this.getProductImage(order);
        const productTitle = this.getProductTitle(order);
        
        return `
            <div class="order-status-card ${isCancelled ? 'cancelled' : ''}" data-order-id="${order.id}">
                <div class="order-card-content">
                    <!-- LEFT COLUMN - Product Image -->
                    <div class="order-card-image">
                        <img src="${productImage}" 
                             alt="${productTitle}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/120x120/CCCCCC/666666?text=Product+Image'">
                    </div>
                    
                    <!-- RIGHT COLUMN - Order Details -->
                    <div class="order-card-details">
                        <!-- Product Information -->
                        <div class="product-info">
                            <div class="order-number">Order #${order.id}</div>
                            <h2 class="product-name">${productTitle}</h2>
                        </div>
                        
                        <!-- Progress Timeline -->
                        <div class="progress-timeline">
                            <div class="timeline-track">
                                <div class="timeline-progress" 
                                     style="width: ${(currentStepIndex / (this.progressSteps.length - 1)) * 100}%">
                                </div>
                            </div>
                            
                            <div class="timeline-steps">
                                ${this.progressSteps.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const stepClass = isCompleted ? 'completed' : isCurrent ? 'active' : '';
                                    const stepDate = this.formatStepDate(order, step.id);
                                    
                                    return `
                                        <div class="timeline-step ${stepClass}" data-step="${step.id}">
                                            <div class="step-indicator ${stepClass}"></div>
                                            <div class="step-info">
                                                <div class="step-label">${step.name}</div>
                                                <div class="step-date">${stepDate}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${isCancelled ? `
                    <div style="
                        background: #f8d7da;
                        color: #721c24;
                        padding: 12px 24px;
                        text-align: center;
                        border-top: 1px solid #f5c6cb;
                        font-weight: 600;
                    ">
                        ❌ Order was cancelled
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Update progress bar for a specific order
    updateOrderProgress(orderId, status) {
        const progressContainer = document.querySelector(`.order-status-card[data-order-id="${orderId}"]`);
        if (progressContainer) {
            const orders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
            const order = orders.find(o => o.id === orderId);
            if (order && this.isBuyForMeOrder(order)) {
                progressContainer.outerHTML = this.generateProgressBar({...order, status});
            }
        }
    }

    // Get progress data for admin
    getProgressDataForAdmin(order) {
        if (!this.isBuyForMeOrder(order)) {
            return null; // Return null for non-Buy For Me orders
        }

        const currentStepIndex = this.getCurrentStepIndex(order.status);
        return {
            currentStep: this.progressSteps[currentStepIndex],
            completedSteps: this.progressSteps.slice(0, currentStepIndex + 1),
            pendingSteps: this.progressSteps.slice(currentStepIndex + 1),
            progressPercentage: (currentStepIndex / (this.progressSteps.length - 1)) * 100,
            currentStepIndex: currentStepIndex,
            totalSteps: this.progressSteps.length
        };
    }

    // Generate compact progress for admin table
    generateCompactProgress(order) {
        if (!this.isBuyForMeOrder(order)) {
            return '<div class="not-bfm-order">Regular Order</div>';
        }

        const progressData = this.getProgressDataForAdmin(order);
        if (!progressData) return '';

        return `
            <div class="progress-tracker compact">
                <div class="progress-bar ${order.status === 'cancelled' ? 'cancelled' : ''}">
                    <div class="progress-fill" style="width: ${progressData.progressPercentage}%"></div>
                </div>
                <div class="progress-percentage">
                    ${Math.round(progressData.progressPercentage)}% Complete
                </div>
                <small style="display:block; margin-top:5px; color:#666;">
                    ${progressData.currentStep.name}
                </small>
            </div>
        `;
    }
}

// Initialize global progress tracker
const progressTracker = new ProgressTracker();
window.progressTracker = progressTracker;
