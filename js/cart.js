// --- Global Cart Logic ---
// Use a function to manage data retrieval and saving
function getCart() {
    return JSON.parse(localStorage.getItem('de_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('de_cart', JSON.stringify(cart));
}

// 🆕 Generate Unique Pickup Code
function generatePickupCode() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DF-${timestamp}-${random}`;
}

// 🆕 Delivery Option Selection
function selectDeliveryOption(option) {
    // Update radio buttons
    document.getElementById('delivery-home').checked = (option === 'delivery');
    document.getElementById('pickup-shop').checked = (option === 'pickup');
    
    // Update visual selection
    document.querySelectorAll('.delivery-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selected class to the clicked option
    const clickedOption = event.currentTarget;
    clickedOption.classList.add('selected');
    
    // Show/hide pickup info
    const pickupInfo = document.getElementById('pickup-info');
    if (option === 'pickup') {
        pickupInfo.classList.add('show');
        // Generate unique code if not already generated
        if (!window.currentPickupCode) {
            window.currentPickupCode = generatePickupCode();
            document.getElementById('pickup-code').textContent = window.currentPickupCode;
        }
    } else {
        pickupInfo.classList.remove('show');
    }
    
    // Store delivery option
    window.selectedDeliveryOption = option;
}

// 🟢 Item Removal Function
function removeItemFromCart(itemTitle) {
    let cart = getCart();

    // Find the index of the first item with the matching title
    const indexToRemove = cart.findIndex(item => item.title === itemTitle);

    if (indexToRemove > -1) {
        // Remove only that item from the array
        cart.splice(indexToRemove, 1);
        saveCart(cart);
        renderCart(); // Re-render the cart immediately
    }
}

// 🚀 UPDATED FUNCTION: Fixed WhatsApp Order Sender
async function sendOrderViaWhatsApp() {
    const cart = getCart();
    
    // 1. Get user details
    const name = document.getElementById('user-name')?.value.trim() || '';
    const city = document.getElementById('user-city')?.value.trim() || '';
    const phone = document.getElementById('user-phone')?.value.trim() || '';

    if (!name || !city || !phone) {
        alert("Please enter your Name, City, and WhatsApp number before sending the order.");
        return;
    }
    
    if (!window.selectedDeliveryOption) {
        alert("Please select a delivery option.");
        return;
    }

    // 2. Validate phone number format
    const phoneRegex = /^254[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
        alert("Please enter a valid Kenyan WhatsApp number (e.g., 254712345678)");
        return;
    }

    // 3. Calculate total
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
    });

    // 4. Create order first to get order ID
    const orderId = await saveOrderToHistory(cart, {
        method: window.selectedDeliveryOption,
        city: city,
        customer: { name, city, phone }
    });
    
    // 5. Track Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: orderId,
            value: total,
            currency: 'KES',
            items: cart.map(item => ({
                item_id: item.id || item.title,
                item_name: item.title,
                price: item.price,
                quantity: item.qty,
                currency: 'KES'
            }))
        });
    }

    // 6. Build message with order ID
    let message = `*✨ New Order from Deenice Finds!*\n\n`;
    message += `*Order ID:* ${orderId}\n`;
    message += `*Customer:* ${name}\n`;
    message += `*City:* ${city}\n`;
    message += `*Phone:* ${phone}\n`;
    message += `*Delivery:* ${window.selectedDeliveryOption === 'pickup' ? '🏪 Pick Up in Shop' : '🚚 Home Delivery'}\n`;

    if (window.selectedDeliveryOption === 'pickup' && window.currentPickupCode) {
        message += `*Pickup Code:* ${window.currentPickupCode}\n`;
    }

    message += `\n*Order Items:*\n`;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        
        let details = [];
        if (item.color) details.push(`Color: ${item.color}`);
        if (item.size) details.push(`Size: ${item.size}`);
        if (item.model && item.model !== 'Standard') details.push(`Model: ${item.model}`);

        message += `${index + 1}. ${item.title}\n`;
        message += `   - Qty: ${item.qty}\n`;
        message += `   - Price: ${item.currency} ${item.price.toLocaleString()}\n`;
        if (details.length > 0) message += `   - Specs: ${details.join(' / ')}\n`;
        message += `   - Subtotal: ${item.currency} ${itemTotal.toLocaleString()}\n\n`;
    });

    message += `*Total Amount: ${cart[0]?.currency || 'KES'} ${total.toLocaleString()}*\n\n`;
    message += `*Order Status:* 📝 Pending\n`;
    message += `_We'll update you on WhatsApp when your order status changes._`;

    // 7. Get WhatsApp number from config
    const config = window.DEENICE_CONFIG || {};
    let whatsappNumber = config.whatsappNumber;

    if (!whatsappNumber) {
        alert("Error: WhatsApp number is not configured. Please contact support.");
        return;
    }
    
    // Clean the WhatsApp number
    whatsappNumber = whatsappNumber.replace(/\s+/g, '').replace('+', '');
    
    // 8. Create WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    console.log('WhatsApp URL:', whatsappURL); // For debugging
    
    // 9. Open WhatsApp with multiple fallback methods
    let whatsappOpened = false;
    
    // Method 1: Try window.open (works on most devices)
    const newWindow = window.open(whatsappURL, '_blank');
    if (newWindow) {
        whatsappOpened = true;
    }
    
    // Method 2: If window.open failed, try location.href after a delay
    setTimeout(() => {
        if (!whatsappOpened) {
            window.location.href = whatsappURL;
            whatsappOpened = true;
        }
    }, 100);
    
    // Method 3: Final fallback - show manual instructions
    setTimeout(() => {
        if (!whatsappOpened || window.location.href.indexOf('whatsapp') === -1) {
            const manualSend = confirm(
                "WhatsApp didn't open automatically.\n\n" +
                "Click OK to copy the order message, then:\n" +
                "1. Open WhatsApp manually\n" +
                "2. Send the message to Deenice Finds\n" +
                "3. We'll confirm your order shortly"
            );
            
            if (manualSend) {
                // Copy message to clipboard
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(message).then(() => {
                        alert("✅ Order message copied to clipboard!\n\n📱 Now open WhatsApp and send it to Deenice Finds.");
                    }).catch(() => {
                        // Fallback if clipboard fails
                        showManualCopyDialog(message);
                    });
                } else {
                    // Fallback for browsers without clipboard API
                    showManualCopyDialog(message);
                }
            }
        }
    }, 2000);
    
    // 10. Show success message
    setTimeout(() => {
        alert(`✅ Order #${orderId} sent successfully!\n\n📋 Status: Pending\n\nWe'll notify you when your order status updates.`);
        
        // Clear the cart and redirect to home page
        localStorage.removeItem('de_cart');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }, 500);
}

// Helper function for manual copy fallback
function showManualCopyDialog(message) {
    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert("✅ Order message copied to clipboard!\n\n📱 Now open WhatsApp and send it to Deenice Finds.");
        } else {
            prompt("📋 Please copy this order message and send it to Deenice Finds on WhatsApp:", message);
        }
    } catch (err) {
        prompt("📋 Please copy this order message and send it to Deenice Finds on WhatsApp:", message);
    }
    
    document.body.removeChild(textarea);
}

// Also update the saveOrderToHistory function to ensure it works correctly:
async function saveOrderToHistory(cart, deliveryInfo) {
    const orderData = {
        items: [...cart],
        totalAmount: cart.reduce((total, item) => total + (item.price * item.qty), 0),
        currency: cart[0]?.currency || 'KES',
        delivery: {
            method: window.selectedDeliveryOption || 'delivery',
            city: document.getElementById('user-city')?.value || '',
            pickupCode: window.currentPickupCode || null
        },
        customer: {
            name: document.getElementById('user-name')?.value || '',
            city: document.getElementById('user-city')?.value || '',
            phone: document.getElementById('user-phone')?.value || ''
        }
    };
    
    let orderId;

    try {
        // Try to save to backend first
        console.log('📦 Saving order to backend...');
        const response = await fetch('https://deenice-finds-1-0-1.onrender.com/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const backendData = await response.json();
            orderId = backendData.order?.id || backendData.id;
            console.log('✅ Order saved to backend:', orderId);
        } else {
            throw new Error(`Backend responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Backend save failed, using fallback:', error);
        // Fallback: Generate local order ID
        orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    }

    // Always save to localStorage for compatibility
    const newOrder = {
        id: orderId,
        orderDate: new Date().toISOString(),
        status: 'pending',
        ...orderData
    };

    // Save to order history (localStorage)
    const existingOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem('de_order_history', JSON.stringify(existingOrders));

    return orderId;
}

// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
