// label-printer.js - STANDARD SIZE WITH PRINT-TIME PAPER SELECTION
class LabelPrinter {
    constructor() {
        this.websiteURL = "https://www.deenice.store";
        this.companyName = "Deenice Finds";
        this.companyTagline = "Premium Tech & Accessories";
        this.qrCodeUrl = "https://res.cloudinary.com/dsthpp4oj/image/upload/w_400,h_400,c_scale,q_100/v1762540599/frame_sie10u.png";
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
                    // Preload the QR code image
                    function preloadImage() {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = resolve;
                            img.onerror = resolve;
                            img.src = '${this.qrCodeUrl}';
                        });
                    }
                    
                    window.onload = async function() {
                        await Promise.race([
                            preloadImage(),
                            new Promise(resolve => setTimeout(resolve, 1500))
                        ]);
                        
                        // Show print dialog but don't auto-close
                        setTimeout(() => {
                            window.print();
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `;
    }

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
                @page {
                    size: 80mm 80mm;
                    margin: 0;
                }
                body {
                    width: 80mm !important;
                    height: 80mm !important;
                    margin: 0 !important;
                    padding: 3mm !important;
                }
            }
        `;
    }

    generateQRCode() {
        return `
            <div class="qr-code">
                <div style="margin-bottom: 2mm; font-weight: bold; text-transform: uppercase;">
                    SCAN TO VISIT OUR STORE
                </div>
                <img src="${this.qrCodeUrl}" 
                     alt="QR Code - www.deenice.store" 
                     class="qr-image"
                     onerror="this.onerror=null; this.style.display='none'; document.getElementById('qr-fallback').style.display='block';">
                <div id="qr-fallback" style="display: none;">
                    <div class="qr-placeholder">
                        QR CODE: ${this.websiteURL}
                    </div>
                </div>
                <div style="font-size: 10px; margin-top: 2mm; font-weight: bold;">
                    ${this.websiteURL}
                </div>
            </div>
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
            </div>
        `;
    }

    generateCustomerInfo(name, phone, city) {
        return `
            <div class="customer-info">
                <div class="section-title">CUSTOMER INFORMATION</div>
                <div class="info-row">
                    <div class="info-label">NAME:</div>
                    <div class="info-value">${name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">PHONE:</div>
                    <div class="info-value">${phone}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">CITY:</div>
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
                    <div class="info-label">METHOD:</div>
                    <div class="info-value">${isPickup ? 'SHOP PICKUP' : 'HOME DELIVERY'}</div>
                </div>
                
                ${isPickup ? `
                    <div class="pickup-code">
                        PICKUP CODE: ${pickupCode}
                    </div>
                ` : ''}
                
                <div class="delivery-destination">
                    <div class="destination-label">DELIVERY ADDRESS:</div>
                    <div>________________________________</div>
                    <div>________________________________</div>
                    <div>________________________________</div>
                </div>
            </div>
        `;
    }

    generateThankYouNote() {
        return `
            <div class="thank-you">
                THANK YOU FOR YOUR ORDER! 🎉<br>WE APPRECIATE YOUR BUSINESS!
            </div>
        `;
    }

    generatePrintInstructions() {
        return `
            <div class="print-instructions">
                PRINTED: ${new Date().toLocaleString()}
            </div>
        `;
    }

    // Print label - user selects paper size in print dialog
    printLabel(order) {
        const labelHTML = this.generateOrderLabel(order);
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        
        printWindow.document.write(labelHTML);
        printWindow.document.close();
    }

    // Preview label
    previewLabel(order) {
        const labelHTML = this.generateOrderLabel(order);
        const previewWindow = window.open('', '_blank');
        
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Label Preview - Order #${order.id}</title>
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
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
                    .print-tip {
                        margin-top: 10px;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="print-controls">
                    <h3>Shipping Label Preview</h3>
                    <p><strong>Order #${order.id}</strong></p>
                    <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>
                    <button class="back-btn" onclick="window.close()">← Back</button>
                    <div class="print-tip">
                        💡 <strong>Print Tip:</strong> Select "80×80mm" or "100×150mm" in your printer settings
                    </div>
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
