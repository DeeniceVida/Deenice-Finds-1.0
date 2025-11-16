// label-printer.js - 6 INCH PAPER OPTIMIZED
class LabelPrinter {
    constructor() {
        this.websiteURL = "https://www.deenice.store";
        this.companyName = "Deenice Finds";
        this.companyTagline = "Premium Tech & Accessories";
        this.qrCodeUrl = "https://res.cloudinary.com/dsthpp4oj/image/upload/w_400,h_400,c_scale,q_100/v1762540599/frame_sie10u.png";
        this.paperWidth = '4in';
        this.paperHeight = '6in';
    }

    // Generate label for an order - OPTIMIZED FOR 6" PAPER
    generateOrderLabel(order) {
        const customerName = order.customer?.name || order.name || 'N/A';
        const customerPhone = order.customer?.phone || order.phone || 'N/A';
        const customerCity = order.customer?.city || order.city || 'N/A';
        const deliveryMethod = order.delivery?.method || 'home';
        const pickupCode = order.delivery?.pickupCode || 'N/A';
        const orderId = order.id;
        const orderDate = new Date(order.orderDate || order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Shipping Label - Order #${orderId}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="css/label-printer.css">
                <style>
                    ${this.getInlineStyles()}
                </style>
            </head>
            <body>
                <div class="label-container">
                    ${this.generateCompanyHeader()}
                    ${this.generateOrderInfo(orderId, orderDate)}
                    ${this.generateCustomerInfo(customerName, customerPhone, customerCity)}
                    ${this.generateDeliveryInfo(deliveryMethod, pickupCode, order)}
                    ${this.generateQRCode()}
                    ${this.generateThankYouNote()}
                    ${this.generatePrintInstructions()}
                </div>
                
                <script>
                    // Enhanced print handling for 6-inch paper
                    let printAttempted = false;
                    
                    function preloadImages() {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = resolve;
                            img.onerror = resolve;
                            img.src = '${this.qrCodeUrl}';
                        });
                    }
                    
                    window.onload = async function() {
                        await Promise.race([
                            preloadImages(),
                            new Promise(resolve => setTimeout(resolve, 1000))
                        ]);
                        
                        if (!printAttempted) {
                            printAttempted = true;
                            setTimeout(() => {
                                window.print();
                            }, 500);
                        }
                    };
                    
                    window.onafterprint = function() {
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    };
                    
                    // Fallback print if onload doesn't trigger
                    setTimeout(() => {
                        if (!printAttempted) {
                            printAttempted = true;
                            window.print();
                        }
                    }, 3000);
                </script>
            </body>
            </html>
        `;
    }

    getInlineStyles() {
        return `
            /* Ensure styles are applied even if CSS doesn't load */
            @page { size: 4in 6in; margin: 0.1in; }
            body { 
                font-family: 'Courier New', monospace !important; 
                font-size: 15px !important;
                width: 4in !important;
                margin: 0 auto !important;
                padding: 0.15in !important;
                background: white !important;
                color: black !important;
                font-weight: bold !important;
            }
            .label-container { 
                border: 3px solid #000 !important;
                padding: 0.2in !important;
                min-height: 5.7in !important;
            }
        `;
    }

    generateCompanyHeader() {
        return `
            <div class="company-header">
                <div class="company-name">${this.companyName}</div>
                <div class="company-tagline">${this.companyTagline}</div>
            </div>
        `;
    }

    generateOrderInfo(orderId, orderDate) {
        return `
            <div class="order-info">
                <div class="section-title">ORDER INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">ORDER ID:</div>
                    <div class="info-value">#${orderId}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">DATE:</div>
                    <div class="info-value">${orderDate}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">TYPE:</div>
                    <div class="info-value">SHIPPING LABEL</div>
                </div>
            </div>
        `;
    }

    generateCustomerInfo(name, phone, city) {
        return `
            <div class="customer-info">
                <div class="section-title">CUSTOMER INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">NAME:</div>
                    <div class="info-value">${this.formatText(name)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">PHONE:</div>
                    <div class="info-value">${this.formatPhone(phone)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CITY:</div>
                    <div class="info-value">${this.formatText(city)}</div>
                </div>
            </div>
        `;
    }

    generateDeliveryInfo(deliveryMethod, pickupCode, order) {
        const isPickup = deliveryMethod === 'pickup';
        const deliveryAddress = order.delivery?.address || '';
        const additionalInfo = order.delivery?.additionalInfo || '';

        return `
            <div class="delivery-info">
                <div class="section-title">DELIVERY INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">METHOD:</div>
                    <div class="info-value">${isPickup ? 'STORE PICKUP' : 'HOME DELIVERY'}</div>
                </div>
                
                ${isPickup ? `
                    <div class="pickup-code">
                        PICKUP CODE: ${pickupCode}
                    </div>
                    <div class="delivery-note">
                        Bring valid ID for verification
                    </div>
                ` : `
                    <div class="info-row">
                        <div class="info-label">ADDRESS:</div>
                        <div class="info-value">${deliveryAddress || 'TO BE PROVIDED'}</div>
                    </div>
                    ${additionalInfo ? `
                        <div class="info-row">
                            <div class="info-label">NOTES:</div>
                            <div class="info-value">${this.formatText(additionalInfo)}</div>
                        </div>
                    ` : ''}
                `}
                
                <div class="delivery-destination">
                    <div class="destination-label">DELIVERY DESTINATION:</div>
                    <div class="address-lines">
                        <div>________________________________</div>
                        <div>________________________________</div>
                        <div>________________________________</div>
                        <div>________________________________</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateQRCode() {
        return `
            <div class="qr-code">
                <div class="qr-title">SCAN FOR ORDER TRACKING</div>
                <img src="${this.qrCodeUrl}" 
                     alt="QR Code - Deenice Finds" 
                     class="qr-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="qr-fallback" style="display: none;">
                    <div class="qr-placeholder">
                        ORDER TRACKING<br>${this.websiteURL}
                    </div>
                </div>
                <div class="website-url">${this.websiteURL}</div>
            </div>
        `;
    }

    generateThankYouNote() {
        return `
            <div class="thank-you">
                <div class="thank-you-message">THANK YOU FOR YOUR ORDER! 🎉</div>
                <div class="appreciation">WE APPRECIATE YOUR BUSINESS!</div>
            </div>
        `;
    }

    generatePrintInstructions() {
        const printTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="print-instructions">
                <div class="print-time">PRINTED: ${printTime}</div>
                <div class="paper-size">PAPER: 6-INCH (4×6)</div>
                <div class="print-ref">REF: ${Date.now().toString(36).toUpperCase()}</div>
            </div>
        `;
    }

    // Utility methods
    formatText(text) {
        if (!text) return 'N/A';
        return text.toString().toUpperCase();
    }

    formatPhone(phone) {
        if (!phone) return 'N/A';
        // Remove all non-numeric characters
        const cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 0) return 'N/A';
        
        // Format for Kenyan numbers or return as is
        if (cleaned.startsWith('254') && cleaned.length === 12) {
            return `+${cleaned}`;
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
            return `+254${cleaned.substring(1)}`;
        } else {
            return cleaned;
        }
    }

    // Print label with 6-inch paper optimization
    printLabel(order) {
        try {
            const labelHTML = this.generateOrderLabel(order);
            const printWindow = window.open('', '_blank', 
                'width=500,height=700,scrollbars=no,location=no,toolbar=no');
            
            if (!printWindow) {
                this.showPrintError('Popup blocked! Please allow popups for printing.');
                return;
            }
            
            printWindow.document.write(labelHTML);
            printWindow.document.close();
            
            // Focus the window
            setTimeout(() => {
                printWindow.focus();
            }, 100);
            
        } catch (error) {
            console.error('Print error:', error);
            this.showPrintError('Failed to open print window. Please try again.');
        }
    }

    // Enhanced preview with 6-inch paper instructions
    previewLabel(order) {
        const labelHTML = this.generateOrderLabel(order);
        const previewWindow = window.open('', '_blank', 
            'width=600,height=900,scrollbars=yes,location=no,toolbar=no');
        
        if (!previewWindow) {
            this.showPrintError('Popup blocked! Please allow popups for preview.');
            return;
        }

        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Label Preview - Order #${order.id}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        padding: 20px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        font-family: Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .preview-header {
                        text-align: center;
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        margin-bottom: 25px;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                        width: 100%;
                        max-width: 550px;
                    }
                    .preview-container {
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.25);
                        margin-bottom: 25px;
                        border: 2px dashed #007bff;
                    }
                    .print-controls {
                        text-align: center;
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                        width: 100%;
                        max-width: 550px;
                        margin-bottom: 20px;
                    }
                    .print-btn {
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 16px 32px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        margin: 0 10px 10px 10px;
                        transition: all 0.3s ease;
                        min-width: 160px;
                    }
                    .print-btn:hover {
                        background: #218838;
                        transform: translateY(-3px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    .back-btn {
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 16px 32px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        margin: 0 10px 10px 10px;
                        transition: all 0.3s ease;
                        min-width: 160px;
                    }
                    .back-btn:hover {
                        background: #545b62;
                        transform: translateY(-3px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                    .print-tip {
                        margin-top: 20px;
                        color: #333;
                        font-size: 14px;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 5px solid #28a745;
                        text-align: left;
                    }
                    .paper-size-info {
                        background: #e7f3ff;
                        padding: 20px;
                        border-radius: 10px;
                        margin: 20px 0;
                        border-left: 5px solid #007bff;
                        text-align: center;
                        font-weight: bold;
                    }
                    .order-summary {
                        background: #fff3cd;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                        border-left: 4px solid #ffc107;
                    }
                    .button-group {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 10px;
                        margin: 15px 0;
                    }
                    @media (max-width: 600px) {
                        .button-group {
                            flex-direction: column;
                            align-items: center;
                        }
                        .print-btn, .back-btn {
                            width: 100%;
                            max-width: 280px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="preview-header">
                    <h2 style="margin: 0 0 10px 0; color: #333;">🚚 Shipping Label Preview</h2>
                    <p style="margin: 0; font-size: 18px; color: #666;"><strong>Order #${order.id}</strong></p>
                    <p style="margin: 5px 0 0 0; color: #888;">${order.customer?.name || 'Customer'}</p>
                </div>
                
                <div class="paper-size-info">
                    <h3 style="margin: 0 0 10px 0; color: #007bff;">📏 6-INCH PAPER OPTIMIZED</h3>
                    <p style="margin: 0;">This label is perfectly sized for standard 6-inch thermal paper rolls or 4×6 inch paper sheets.</p>
                </div>
                
                <div class="order-summary">
                    <strong>📦 Order Summary:</strong><br>
                    • Customer: ${order.customer?.name || 'N/A'}<br>
                    • Items: ${order.items?.length || 0} item(s)<br>
                    • Total: KES ${order.totalAmount?.toLocaleString() || '0'}<br>
                    • Status: ${order.status?.toUpperCase() || 'PENDING'}
                </div>
                
                <div class="preview-container">
                    ${labelHTML}
                </div>
                
                <div class="print-controls">
                    <h3 style="margin: 0 0 20px 0; color: #333;">Print Controls</h3>
                    
                    <div class="button-group">
                        <button class="print-btn" onclick="window.print()">
                            🖨️ Print Label
                        </button>
                        <button class="back-btn" onclick="window.close()">
                            ← Close Preview
                        </button>
                    </div>
                    
                    <div class="print-tip">
                        <strong>🎯 PRINTING INSTRUCTIONS:</strong><br><br>
                        <strong>1. PAPER SIZE:</strong> Select "4×6" or "6 inch" in print dialog<br>
                        <strong>2. MARGINS:</strong> Set to "None" or "Minimum"<br>
                        <strong>3. SCALE:</strong> Set to 100% or "Actual Size"<br>
                        <strong>4. HEADERS/FOOTERS:</strong> Disable for clean print<br>
                        <strong>5. ORIENTATION:</strong> Portrait (default)<br><br>
                        <strong>💡 Tip:</strong> Use thermal paper for best results with thermal printers
                    </div>
                </div>
                
                <script>
                    // Add print success message
                    window.addEventListener('afterprint', function() {
                        alert('Label sent to printer! Check your printer output.');
                    });
                </script>
            </body>
            </html>
        `);
        previewWindow.document.close();
    }

    showPrintError(message) {
        alert(`🖨️ Print Error: ${message}`);
    }

    // Bulk print multiple labels
    printBulkLabels(orders) {
        if (!orders || orders.length === 0) {
            this.showPrintError('No orders selected for printing.');
            return;
        }

        if (orders.length === 1) {
            this.printLabel(orders[0]);
            return;
        }

        // Confirm bulk printing
        if (!confirm(`Print ${orders.length} shipping labels? Each label will open in a separate window.`)) {
            return;
        }

        // Print each label with delay to avoid blocking
        orders.forEach((order, index) => {
            setTimeout(() => {
                this.printLabel(order);
            }, index * 1000); // 1 second delay between each
        });
    }

    // Test label generation
    generateTestLabel() {
        const testOrder = {
            id: 'DF' + Date.now().toString(36).toUpperCase(),
            customer: {
                name: 'John Doe',
                phone: '+254712345678',
                city: 'Nairobi'
            },
            delivery: {
                method: 'home',
                address: '123 Main Street, Westlands'
            },
            orderDate: new Date().toISOString(),
            totalAmount: 24500,
            items: [
                { title: 'iPhone 15 Pro Case', qty: 1, price: 2500 },
                { title: 'Wireless Earbuds', qty: 2, price: 11000 }
            ]
        };
        
        return this.generateOrderLabel(testOrder);
    }
}

// Initialize global label printer with error handling
let labelPrinter;
try {
    labelPrinter = new LabelPrinter();
} catch (error) {
    console.error('Failed to initialize LabelPrinter:', error);
    // Fallback initialization
    labelPrinter = {
        printLabel: (order) => {
            alert('Label printer not available. Please refresh the page.');
        },
        previewLabel: (order) => {
            alert('Label preview not available. Please refresh the page.');
        }
    };
}

// Make it globally available
window.labelPrinter = labelPrinter;
