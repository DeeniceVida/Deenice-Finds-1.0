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

    // In your label-printer.js, update the getThermalPrinterStyles method:
getThermalPrinterStyles() {
    return `
        * { 
            margin: 0 !important; 
            padding: 0 !important; 
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        body { 
            font-family: 'Courier New', monospace !important; 
            font-size: 14px !important;
            line-height: 1.1 !important;
            width: 80mm !important;
            margin: 0 auto !important;
            padding: 3mm !important;
            background: white !important;
            color: #000000 !important;
            font-weight: bold !important;
        }
        .label-container {
            border: 2px solid #000000 !important;
            padding: 4mm !important;
            page-break-inside: avoid !important;
            background: white !important;
        }
        .company-header {
            text-align: center !important;
            margin-bottom: 4mm !important;
            border-bottom: 2px dashed #000000 !important;
            padding-bottom: 3mm !important;
        }
        .company-name {
            font-size: 18px !important;
            font-weight: 900 !important;
            margin-bottom: 2mm !important;
            text-transform: uppercase !important;
            color: #000000 !important;
        }
        .company-tagline {
            font-size: 12px !important;
            font-weight: bold !important;
            color: #000000 !important;
        }
        .order-info, .customer-info, .delivery-info {
            margin-bottom: 4mm !important;
        }
        .section-title {
            font-weight: 900 !important;
            border-bottom: 2px solid #000000 !important;
            margin-bottom: 2mm !important;
            font-size: 13px !important;
            text-transform: uppercase !important;
            padding-bottom: 1mm !important;
            color: #000000 !important;
        }
        .info-row {
            display: flex !important;
            margin-bottom: 2mm !important;
        }
        .info-label {
            font-weight: 900 !important;
            min-width: 28mm !important;
            text-transform: uppercase !important;
            color: #000000 !important;
        }
        .info-value {
            flex: 1 !important;
            font-weight: bold !important;
            border-bottom: 1px dotted #000000 !important;
            padding-bottom: 1mm !important;
            color: #000000 !important;
        }
        .qr-code {
            text-align: center !important;
            margin: 4mm 0 !important;
            padding: 3mm !important;
            border: 2px dashed #000000 !important;
            background: #f0f0f0 !important;
        }
        .qr-image {
            width: 40mm !important;
            height: 40mm !important;
            border: 2px solid #000000 !important;
            display: block !important;
            margin: 0 auto !important;
            background: white !important;
        }
        .qr-placeholder {
            width: 40mm !important;
            height: 40mm !important;
            border: 2px solid #000000 !important;
            margin: 0 auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 10px !important;
            text-align: center !important;
            background: white !important;
            font-weight: bold !important;
            padding: 2mm !important;
            color: #000000 !important;
        }
        .thank-you {
            text-align: center !important;
            margin-top: 4mm !important;
            padding-top: 3mm !important;
            border-top: 2px dashed #000000 !important;
            font-weight: bold !important;
            font-size: 13px !important;
            color: #000000 !important;
        }
        .delivery-destination {
            border: 2px dashed #000000 !important;
            padding: 3mm !important;
            margin: 3mm 0 !important;
            min-height: 18mm !important;
            background: #f8f8f8 !important;
        }
        .destination-label {
            font-weight: 900 !important;
            margin-bottom: 2mm !important;
            text-transform: uppercase !important;
            color: #000000 !important;
        }
        .pickup-code {
            background: #d0d0d0 !important;
            padding: 3mm !important;
            text-align: center !important;
            border: 2px solid #000000 !important;
            margin: 3mm 0 !important;
            font-weight: 900 !important;
            font-size: 16px !important;
            text-transform: uppercase !important;
            color: #000000 !important;
        }
        .print-instructions {
            font-size: 10px !important;
            text-align: center !important;
            margin-top: 3mm !important;
            color: #000000 !important;
            font-weight: bold !important;
            border-top: 1px solid #000000 !important;
            padding-top: 2mm !important;
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
    // Optimized Cloudinary URL for thermal printing
    const qrCodeUrl = "https://res.cloudinary.com/dsthpp4oj/image/upload/w_400,h_400,c_scale,q_100/v1762540599/frame_sie10u.png";
    
    return `
        <div class="qr-code">
            <div style="margin-bottom: 2mm; font-weight: bold; text-transform: uppercase;">Scan to visit our store</div>
            <img src="${qrCodeUrl}" 
                 alt="QR Code - www.deenice.store" 
                 class="qr-image"
                 style="width: 40mm; height: 40mm; border: 2px solid #000; display: block; margin: 0 auto; background: white;"
                 onerror="this.onerror=null; this.src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.deenice.store';">
            <div style="font-size: 10px; margin-top: 2mm; font-weight: bold;">
                www.deenice.store
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
