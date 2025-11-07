// label-printer.js - SUPPORTS 80x80mm AND 100x150mm
class LabelPrinter {
    constructor() {
        this.websiteURL = "https://www.deenice.store";
        this.companyName = "Deenice Finds";
        this.companyTagline = "Premium Tech & Accessories";
        this.qrCodeUrl = "https://res.cloudinary.com/dsthpp4oj/image/upload/w_400,h_400,c_scale,q_100/v1762540599/frame_sie10u.png";
        this.defaultPaperSize = '80x80'; // or '100x150'
    }

    // Generate label for an order with paper size option
    generateOrderLabel(order, paperSize = '80x80') {
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
                    ${this.getThermalPrinterStyles(paperSize)}
                </style>
            </head>
            <body>
                <div class="label-container">
                    ${this.generateCompanyHeader(paperSize)}
                    ${this.generateOrderInfo(orderId, orderDate, paperSize)}
                    ${this.generateCustomerInfo(customerName, customerPhone, customerCity, paperSize)}
                    ${this.generateDeliveryInfo(deliveryMethod, pickupCode, paperSize)}
                    ${this.generateQRCode(paperSize)}
                    ${this.generateThankYouNote(paperSize)}
                    ${this.generatePrintInstructions(paperSize)}
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
                        
                        setTimeout(() => {
                            window.print();
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `;
    }

    getThermalPrinterStyles(paperSize = '80x80') {
        const isLarge = paperSize === '100x150';
        
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
                font-size: ${isLarge ? '16px' : '14px'} !important;
                line-height: 1.1 !important;
                width: ${isLarge ? '100mm' : '80mm'} !important;
                height: ${isLarge ? '150mm' : '80mm'} !important;
                margin: 0 auto !important;
                padding: ${isLarge ? '4mm' : '3mm'} !important;
                background: white !important;
                color: #000000 !important;
                font-weight: bold !important;
            }
            .label-container {
                border: 2px solid #000000 !important;
                padding: ${isLarge ? '5mm' : '4mm'} !important;
                page-break-inside: avoid !important;
                background: white !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .company-header {
                text-align: center !important;
                margin-bottom: ${isLarge ? '5mm' : '4mm'} !important;
                border-bottom: 2px dashed #000000 !important;
                padding-bottom: ${isLarge ? '4mm' : '3mm'} !important;
            }
            .company-name {
                font-size: ${isLarge ? '22px' : '18px'} !important;
                font-weight: 900 !important;
                margin-bottom: ${isLarge ? '3mm' : '2mm'} !important;
                text-transform: uppercase !important;
                color: #000000 !important;
            }
            .company-tagline {
                font-size: ${isLarge ? '14px' : '12px'} !important;
                font-weight: bold !important;
                color: #000000 !important;
            }
            .order-info, .customer-info, .delivery-info {
                margin-bottom: ${isLarge ? '5mm' : '4mm'} !important;
            }
            .section-title {
                font-weight: 900 !important;
                border-bottom: 2px solid #000000 !important;
                margin-bottom: ${isLarge ? '3mm' : '2mm'} !important;
                font-size: ${isLarge ? '15px' : '13px'} !important;
                text-transform: uppercase !important;
                padding-bottom: 1mm !important;
                color: #000000 !important;
            }
            .info-row {
                display: flex !important;
                margin-bottom: ${isLarge ? '3mm' : '2mm'} !important;
            }
            .info-label {
                font-weight: 900 !important;
                min-width: ${isLarge ? '35mm' : '28mm'} !important;
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
                margin: ${isLarge ? '5mm' : '4mm'} 0 !important;
                padding: ${isLarge ? '4mm' : '3mm'} !important;
                border: 2px dashed #000000 !important;
                background: #f0f0f0 !important;
                flex-grow: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
            }
            .qr-image {
                width: ${isLarge ? '50mm' : '40mm'} !important;
                height: ${isLarge ? '50mm' : '40mm'} !important;
                border: 2px solid #000000 !important;
                display: block !important;
                margin: 0 auto !important;
                background: white !important;
            }
            .qr-placeholder {
                width: ${isLarge ? '50mm' : '40mm'} !important;
                height: ${isLarge ? '50mm' : '40mm'} !important;
                border: 2px solid #000000 !important;
                margin: 0 auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: ${isLarge ? '12px' : '10px'} !important;
                text-align: center !important;
                background: white !important;
                font-weight: bold !important;
                padding: 2mm !important;
                color: #000000 !important;
            }
            .thank-you {
                text-align: center !important;
                margin-top: ${isLarge ? '5mm' : '4mm'} !important;
                padding-top: ${isLarge ? '4mm' : '3mm'} !important;
                border-top: 2px dashed #000000 !important;
                font-weight: bold !important;
                font-size: ${isLarge ? '15px' : '13px'} !important;
                color: #000000 !important;
            }
            .delivery-destination {
                border: 2px dashed #000000 !important;
                padding: ${isLarge ? '4mm' : '3mm'} !important;
                margin: ${isLarge ? '4mm' : '3mm'} 0 !important;
                min-height: ${isLarge ? '25mm' : '18mm'} !important;
                background: #f8f8f8 !important;
            }
            .destination-label {
                font-weight: 900 !important;
                margin-bottom: ${isLarge ? '3mm' : '2mm'} !important;
                text-transform: uppercase !important;
                color: #000000 !important;
            }
            .pickup-code {
                background: #d0d0d0 !important;
                padding: ${isLarge ? '4mm' : '3mm'} !important;
                text-align: center !important;
                border: 2px solid #000000 !important;
                margin: ${isLarge ? '4mm' : '3mm'} 0 !important;
                font-weight: 900 !important;
                font-size: ${isLarge ? '18px' : '16px'} !important;
                text-transform: uppercase !important;
                color: #000000 !important;
            }
            .print-instructions {
                font-size: ${isLarge ? '12px' : '10px'} !important;
                text-align: center !important;
                margin-top: ${isLarge ? '4mm' : '3mm'} !important;
                color: #000000 !important;
                font-weight: bold !important;
                border-top: 1px solid #000000 !important;
                padding-top: 2mm !important;
            }
            @media print {
                .no-print { display: none !important; }
                body { 
                    width: ${isLarge ? '100mm' : '80mm'} !important;
                    height: ${isLarge ? '150mm' : '80mm'} !important;
                }
            }
        `;
    }

    generateQRCode(paperSize = '80x80') {
        const isLarge = paperSize === '100x150';
        
        return `
            <div class="qr-code">
                <div style="margin-bottom: ${isLarge ? '3mm' : '2mm'}; font-weight: bold; text-transform: uppercase;">
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
                <div style="font-size: ${isLarge ? '12px' : '10px'}; margin-top: ${isLarge ? '3mm' : '2mm'}; font-weight: bold;">
                    ${this.websiteURL}
                </div>
            </div>
        `;
    }

    // Update other generation methods to accept paperSize parameter
    generateCompanyHeader(paperSize = '80x80') {
        const isLarge = paperSize === '100x150';
        
        return `
            <div class="company-header">
                <div class="company-name">${this.companyName}</div>
                <div class="company-tagline">${this.companyTagline}</div>
            </div>
        `;
    }

    generateOrderInfo(orderId, orderDate, paperSize = '80x80') {
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

    generateCustomerInfo(name, phone, city, paperSize = '80x80') {
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

    generateDeliveryInfo(deliveryMethod, pickupCode, paperSize = '80x80') {
        const isLarge = paperSize === '100x150';
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
                    ${isLarge ? `<div>________________________________</div>` : ''}
                </div>
            </div>
        `;
    }

    generateThankYouNote(paperSize = '80x80') {
        const isLarge = paperSize === '100x150';
        
        return `
            <div class="thank-you">
                ${isLarge ? 
                    'THANK YOU FOR YOUR ORDER! 🎉<br>WE APPRECIATE YOUR BUSINESS AND LOOK FORWARD TO SERVING YOU AGAIN!' :
                    'THANK YOU FOR YOUR ORDER! 🎉<br>WE APPRECIATE YOUR BUSINESS!'
                }
            </div>
        `;
    }

    generatePrintInstructions(paperSize = '80x80') {
        return `
            <div class="print-instructions">
                PRINTED: ${new Date().toLocaleString()}
            </div>
        `;
    }

    // Print with paper size selection
    printLabel(order, paperSize = '80x80') {
        const labelHTML = this.generateOrderLabel(order, paperSize);
        const printWindow = window.open('', '_blank', 'width=500,height=700');
        
        printWindow.document.write(labelHTML);
        printWindow.document.close();
    }

    // Preview with paper size selection
    previewLabel(order, paperSize = '80x80') {
        const labelHTML = this.generateOrderLabel(order, paperSize);
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
                        max-width: 500px;
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
                    .paper-size-selector {
                        margin: 15px 0;
                    }
                    .paper-btn {
                        background: #17a2b8;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin: 5px;
                        font-size: 14px;
                    }
                    .paper-btn.active {
                        background: #0056b3;
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
                    <h3>Label Preview - Order #${order.id}</h3>
                    <div class="paper-size-selector">
                        <strong>Paper Size:</strong>
                        <button class="paper-btn active" onclick="switchPaperSize('80x80')">80×80mm</button>
                        <button class="paper-btn" onclick="switchPaperSize('100x150')">100×150mm</button>
                    </div>
                    <button class="print-btn" onclick="window.print()">🖨️ Print Label</button>
                    <button class="back-btn" onclick="window.close()">← Back</button>
                </div>
                <div class="preview-container">
                    ${labelHTML}
                </div>
                
                <script>
                    function switchPaperSize(size) {
                        document.querySelectorAll('.paper-btn').forEach(btn => btn.classList.remove('active'));
                        event.target.classList.add('active');
                        window.location.href = '?paperSize=' + size;
                    }
                </script>
            </body>
            </html>
        `);
        previewWindow.document.close();
    }
}

// Initialize global label printer
const labelPrinter = new LabelPrinter();
