// js/progress-tracker.js - Progress Tracking System for Buy For Me Orders
class ProgressTracker {
    constructor() {
        this.progressSteps = [
            { 
                id: 'ordered', 
                name: 'Ordered', 
                description: '11/26/2025' 
            },
            { 
                id: 'preparing', 
                name: 'Preparing', 
                description: '11/26/2025' 
            },
            { 
                id: 'shipped', 
                name: 'Shipped', 
                description: '11/26/2025' 
            },
            { 
                id: 'delivered', 
                name: 'Delivered', 
                description: '12/1/2025 Estimate' 
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
            'shipped': orderDate,
            'delivered': new Date(orderDate.getTime() + (5 * 24 * 60 * 60 * 1000)) // +5 days
        };
        
        const date = dateMap[stepId] || orderDate;
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    // Generate progress bar HTML ONLY for Buy For Me orders
    generateProgressBar(order) {
        if (!this.isBuyForMeOrder(order)) {
            return ''; // Return empty string for non-Buy For Me orders
        }

        const currentStepIndex = this.getCurrentStepIndex(order.status);
        const isCancelled = order.status === 'cancelled';
        
        // Get product title from order
        const productTitle = order.items && order.items[0] ? 
            order.items[0].title : 'Buy For Me Product';
        
        return `
            <div class="progress-tracker" data-order-id="${order.id}">
                <!-- Order ID and Product Title -->
                <div class="order-id">Order #${order.id}</div>
                <div class="product-title">${productTitle}</div>
                
                <!-- Progress Bar -->
                <div class="progress-bar ${isCancelled ? 'cancelled' : ''}">
                    <div class="progress-fill" style="width: ${(currentStepIndex / (this.progressSteps.length - 1)) * 100}%"></div>
                </div>
                
                <!-- Progress Steps -->
                <div class="progress-steps">
                    ${this.progressSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const stepClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';
                        const stepDate = this.formatStepDate(order, step.id);
                        const stepDescription = step.id === 'delivered' ? 
                            `${stepDate} Estimate` : stepDate;
                        
                        return `
                            <div class="progress-step ${stepClass} ${isCancelled ? 'cancelled' : ''}" data-step="${step.id}">
                                <div class="step-info">
                                    <div class="step-name">${step.name}</div>
                                    <div class="step-description">${stepDescription}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${isCancelled ? `
                    <div class="progress-cancelled-notice">
                        ❌ Order was cancelled
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Update progress bar for a specific order
    updateOrderProgress(orderId, status) {
        const progressContainer = document.querySelector(`.progress-tracker[data-order-id="${orderId}"]`);
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
            return '<div class="not-bfm-order">Regular Order</div>'; // Show different text for regular orders
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
