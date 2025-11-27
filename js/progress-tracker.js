// js/progress-tracker.js - Progress Tracking System
class ProgressTracker {
    constructor() {
        this.progressSteps = [
            { id: 'order_received', name: 'Order Received', description: 'We have received your order and are reviewing it' },
            { id: 'payment_processing', name: 'Payment Processing', description: 'Processing your payment securely' },
            { id: 'sourcing_product', name: 'Sourcing Product', description: 'Locating and purchasing your product from the US' },
            { id: 'quality_check', name: 'Quality Check', description: 'Inspecting product quality before shipping' },
            { id: 'shipping_preparation', name: 'Shipping Preparation', description: 'Preparing your item for international shipping' },
            { id: 'shipped', name: 'Shipped', description: 'Your item is on its way to Kenya' },
            { id: 'delivered', name: 'Delivered', description: 'Your order has been delivered' }
        ];
    }

    // Get progress step by status
    getStepByStatus(status) {
        const stepMap = {
            'pending': 'order_received',
            'processing': 'payment_processing',
            'sourcing': 'sourcing_product',
            'quality_check': 'quality_check',
            'shipping_preparation': 'shipping_preparation',
            'shipped': 'shipped',
            'completed': 'delivered',
            'cancelled': 'order_received'
        };
        
        return stepMap[status] || 'order_received';
    }

    // Get current step index
    getCurrentStepIndex(status) {
        const currentStep = this.getStepByStatus(status);
        return this.progressSteps.findIndex(step => step.id === currentStep);
    }

    // Generate progress bar HTML
    generateProgressBar(status, orderId = '') {
        const currentStepIndex = this.getCurrentStepIndex(status);
        const isCancelled = status === 'cancelled';
        
        return `
            <div class="progress-tracker" data-order-id="${orderId}">
                <div class="progress-bar ${isCancelled ? 'cancelled' : ''}">
                    <div class="progress-fill" style="width: ${(currentStepIndex / (this.progressSteps.length - 1)) * 100}%"></div>
                </div>
                <div class="progress-steps">
                    ${this.progressSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const stepClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';
                        
                        return `
                            <div class="progress-step ${stepClass} ${isCancelled ? 'cancelled' : ''}" data-step="${step.id}">
                                <div class="step-indicator">
                                    ${isCompleted ? '✓' : index + 1}
                                </div>
                                <div class="step-info">
                                    <div class="step-name">${step.name}</div>
                                    <div class="step-description">${step.description}</div>
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
            progressContainer.outerHTML = this.generateProgressBar(status, orderId);
        }
    }

    // Get progress data for admin
    getProgressDataForAdmin(status) {
        const currentStepIndex = this.getCurrentStepIndex(status);
        return {
            currentStep: this.progressSteps[currentStepIndex],
            completedSteps: this.progressSteps.slice(0, currentStepIndex + 1),
            pendingSteps: this.progressSteps.slice(currentStepIndex + 1),
            progressPercentage: (currentStepIndex / (this.progressSteps.length - 1)) * 100,
            currentStepIndex: currentStepIndex,
            totalSteps: this.progressSteps.length
        };
    }
}

// Initialize global progress tracker
const progressTracker = new ProgressTracker();
window.progressTracker = progressTracker;
