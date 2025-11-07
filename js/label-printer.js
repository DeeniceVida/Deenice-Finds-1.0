// label-printer.js
class LabelPrinter {
    constructor() {
        this.websiteURL = "https://www.deenice.store";
        this.companyName = "Deenice Finds";
        this.companyTagline = "Premium Tech & Accessories";
    }

    // Generate label for an order
    generateOrderLabel(order) {
        const customerName = order.customer?.name || order.name || 'N/A';
        const customerPhone = order.customer?.phone || order.phone || 'N/A';
        const customerCity = order.customer?.city || order.city || 'N/A';
        const deliveryMethod = order.delivery?.method || 'home';
        const pickupCode = order.delivery?.pickupCode || 'N/A';
        const orderId = order.id;
        const orderDate = new Date(order.orderDate || order.date).toLocaleDateString();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Shipping Label - Order #${orderId}</title>
                <link rel="stylesheet" href="css/label-printer.css">
                <style>
                    ${this.getThermalPrinterStyles()}
                </style>
            </head>
            <body>
                <div class="label-container">
                    ${this.generateCompanyHeader()}
                    ${this.generateOrderInfo(orderId, orderDate)}
                    ${this.generateCustomerInfo(customerName, customerPhone, customerCity)}
                    ${this.generateDeliveryInfo(deliveryMethod, pickupCode)}
                    ${this.generateQRCode()}
                    ${this.generateThankYouNote()}
                    ${this.generatePrintInstructions()}
                </div>
                
                <script>
                    // Auto-print when loaded
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => {
                                window.close();
                            }, 1000);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
    }

    getThermalPrinterStyles() {
        return `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2;
                width: 80mm;
                margin: 0 auto;
                padding: 2mm;
                background: white;
                color: black;
            }
            .label-container {
                border: 1px solid #000;
                padding: 3mm;
                page-break-inside: avoid;
            }
            .company-header {
                text-align: center;
                margin-bottom: 3mm;
                border-bottom: 1px dashed #000;
                padding-bottom: 2mm;
            }
            .company-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 1mm;
            }
            .company-tagline {
                font-size: 10px;
                font-style: italic;
            }
            .order-info, .customer-info, .delivery-info {
                margin-bottom: 3mm;
            }
            .section-title {
                font-weight: bold;
                border-bottom: 1px solid #000;
                margin-bottom: 1mm;
                font-size: 11px;
            }
            .info-row {
                display: flex;
                margin-bottom: 1mm;
            }
            .info-label {
                font-weight: bold;
                min-width: 25mm;
            }
            .info-value {
                flex: 1;
            }
            .qr-code {
                text-align: center;
                margin: 3mm 0;
                padding: 2mm;
                border: 1px dashed #000;
            }
            .qr-placeholder {
                width: 35mm;
                height: 35mm;
                border: 1px solid #ccc;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                text-align: center;
                background: #f9f9f9;
            }
            .thank-you {
                text-align: center;
                margin-top: 3mm;
                padding-top: 2mm;
                border-top: 1px dashed #000;
                font-style: italic;
            }
            .delivery-destination {
                border: 1px dashed #000;
                padding: 2mm;
                margin: 2mm 0;
                min-height: 15mm;
            }
            .destination-label {
                font-weight: bold;
                margin-bottom: 1mm;
            }
            .pickup-code {
                background: #f0f0f0;
                padding: 2mm;
                text-align: center;
                border: 1px solid #000;
                margin: 2mm 0;
                font-weight: bold;
                font-size: 14px;
            }
            .print-instructions {
                font-size: 9px;
                text-align: center;
                margin-top: 2mm;
                color: #666;
            }
            @media print {
                .no-print { display: none !important; }
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
                    <div class="info-label">Order ID:</div>
                    <div class="info-value">#${orderId}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${orderDate}</div>
                </div>
            </div>
        `;
    }

    generateCustomerInfo(name, phone, city) {
        return `
            <div class="customer-info">
                <div class="section-title">CUSTOMER INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${phone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">City:</div>
                    <div class="info-value">${city}</div>
                </div>
            </div>
        `;
    }

    generateDeliveryInfo(deliveryMethod, pickupCode) {
        const isPickup = deliveryMethod === 'pickup';
        
        return `
            <div class="delivery-info">
                <div class="section-title">DELIVERY INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">Method:</div>
                    <div class="info-value">${isPickup ? 'Shop Pickup' : 'Home Delivery'}</div>
                </div>
                
                ${isPickup ? `
                    <div class="pickup-code">
                        PICKUP CODE: ${pickupCode}
                    </div>
                ` : ''}
                
                <div class="delivery-destination">
                    <div class="destination-label">Delivery Address:</div>
                    <div>________________________________</div>
                    <div>________________________________</div>
                    <div>________________________________</div>
                </div>
            </div>
        `;
    }

    generateQRCode() {
        return `
            <div class="qr-code">
                <div style="margin-bottom: 2mm; font-weight: bold;">Scan for more info:</div>
                <div class="qr-placeholder">
                    QR Code: ${this.websiteURL}
                </div>
                <div style="font-size: 9px; margin-top: 1mm;">
                    Visit: ${this.websiteURL}
                </div>
            </div>
        `;
    }

    generateThankYouNote() {
        return `
            <div class="thank-you">
                Thank you for your order! 🎉<br>
                We appreciate your business
            </div>
        `;
    }

    generatePrintInstructions() {
        return `
            <div class="print-instructions">
                Printed on: ${new Date().toLocaleString()}
            </div>
        `;
    }

    // Open print window
    printLabel(order) {
        const labelHTML = this.generateOrderLabel(order);
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        
        printWindow.document.write(labelHTML);
        printWindow.document.close();
    }

    // Preview label in current window
    previewLabel(order) {
        const labelHTML = this.generateOrderLabel(order);
        const previewWindow = window.open('', '_blank');
        
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Label Preview - Order #${order.id}</title>
                <link rel="stylesheet" href="css/label-printer.css">
                <style>
                    body { 
                        padding: 20px; 
                        background: #f5f5f5;
                        font-family: Arial, sans-serif;
                    }
                    .preview-container {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .print-controls {
                        text-align: center;
                        margin: 20px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                    }
                    .print-btn {
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                    }
                    .back-btn {
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                    }
                </style>
            </head>
            <body>
                <div class="print-controls">
                    <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>
                    <button class="back-btn" onclick="window.close()">← Back</button>
                </div>
                <div class="preview-container">
                    ${labelHTML}
                </div>
            </body>
            </html>
        `);
        previewWindow.document.close();
    }
}

// Initialize global label printer
const labelPrinter = new LabelPrinter();
