// --- Global Cart Logic ---
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
    const indexToRemove = cart.findIndex(item => item.title === itemTitle);

    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
        saveCart(cart);
        renderCart();
    }
}

// --- Cart Renderer (Apple-style glass design) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();
    const summaryContainer = document.getElementById('cart-summary');

    if (!list || !summaryContainer) {
        console.error('Cart elements not found');
        return;
    }

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="empty-cart glass-card" style="padding: 60px 20px;">
                <h2>Your cart is empty</h2>
                <p>Add some products to get started!</p>
                <a href="index.html" class="continue-shopping">
                    Continue Shopping
                </a>
            </div>
        `;
        summaryContainer.innerHTML = '';
        if (btn) {
            btn.style.display = 'none';
            btn.disabled = true;
        }
        
        // Hide form and delivery options
        const existingForm = document.getElementById('user-details-form');
        const deliveryOptions = document.getElementById('delivery-options');
        if (existingForm) existingForm.style.display = 'none';
        if (deliveryOptions) deliveryOptions.style.display = 'none';
        
        return;
    }

    // --- Calculate Total and Display Summary ---
    let total = 0;
    const currency = cart[0].currency;
    cart.forEach(item => {
        total += item.price * item.qty;
    });

    summaryContainer.innerHTML = `
        <div class="cart-summary glass-card">
            <h2>Total: ${currency} ${total.toLocaleString()}</h2>
        </div>
    `;

    // Build the cart HTML with Apple-style glass design
    let html = `
        <div class="cart-items-container">
            ${cart.map(item => `
                <div class="cart-item glass-card" data-product-title="${item.title}">
                    <img src="${item.img || 'https://via.placeholder.com/80'}" alt="${item.title}" class="cart-item-image" 
                         onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'" />
                    <div class="cart-item-details">
                        <strong class="cart-item-title">${item.title}</strong>
                        <div class="cart-item-specs">
                            ${item.color || ''} 
                            ${item.size ? `/ ${item.size}` : ''}
                            ${item.model && item.model !== 'Standard' ? `/ ${item.model}` : ''}
                        </div>
                        <div class="cart-item-price">
                            ${item.qty} × ${currency} ${item.price.toLocaleString()}
                        </div>
                    </div>
                    <button class="remove-from-cart-btn" data-item-title="${item.title}">
                        Remove
                    </button>
                </div>
            `).join('')}
        </div>
    `;

    list.innerHTML = html;
    if (btn) {
        btn.style.display = 'block';
        btn.disabled = true; // Disable until form is filled
    }

    // Create or update premium user details form
    let form = document.getElementById('user-details-form');
    if (!form) {
        form = document.createElement('div');
        form.id = 'user-details-form';
        form.className = 'premium-form glass-card';
        form.innerHTML = `
            <h3>Your Details</h3>
            <div class="form-group">
                <input type="text" 
                       id="user-name" 
                       class="premium-input" 
                       placeholder="Enter your full name" 
                       required>
            </div>
            <div class="form-group">
                <input type="text" 
                       id="user-city" 
                       class="premium-input" 
                       placeholder="Enter your city/town" 
                       required>
            </div>
            <div class="form-group">
                <input type="tel" 
                       id="user-phone" 
                       class="premium-input" 
                       placeholder="e.g., 254712345678" 
                       required>
                <span class="form-note">Enter your WhatsApp number without + or 0</span>
            </div>
        `;
        
        // Insert form after cart summary
        summaryContainer.insertAdjacentElement('afterend', form);
    }
    form.classList.add('show');

    // Create or update delivery options
    let deliveryOptions = document.getElementById('delivery-options');
    if (!deliveryOptions) {
        deliveryOptions = document.createElement('div');
        deliveryOptions.id = 'delivery-options';
        deliveryOptions.className = 'delivery-options glass-card';
        deliveryOptions.innerHTML = `
            <h3>Delivery Options</h3>
            <div class="delivery-options-container">
                <div class="delivery-option" onclick="selectDeliveryOption('delivery')">
                    <input type="radio" id="delivery-home" name="delivery" value="delivery">
                    <div class="delivery-label">
                        <strong>Home Delivery</strong>
                        <small>Get your order delivered to your address</small>
                    </div>
                </div>
                
                <div class="delivery-option" onclick="selectDeliveryOption('pickup')">
                    <input type="radio" id="pickup-shop" name="delivery" value="pickup">
                    <div class="delivery-label">
                        <strong>Pick Up in Shop</strong>
                        <small>Collect your order from our store</small>
                    </div>
                </div>
            </div>
            
            <!-- Pickup Information -->
            <div id="pickup-info" class="pickup-info">
                <h4>Store Pickup Information</h4>
                
                <div class="pickup-code" id="pickup-code">
                    <!-- Unique code will be generated here -->
                </div>
                
                <div class="shop-address">
                    <strong>Our Store Location:</strong><br>
                    Dynamic Mall, Shop ML 135, 3rd Floor<br>
                    Along Tom Mboya Street<br>
                    Behind The National Archives<br>
                    Opposite AMBASSADEUR<br>
                    Nairobi, Kenya
                </div>
                
                <a href="https://maps.google.com/maps?q=Dynamic+Mall+Tom+Mboya+Street+Nairobi" 
                   target="_blank" class="map-link">
                   Open in Google Maps
                </a>
                
                <div class="instructions">
                    <strong>Pickup Instructions:</strong><br>
                    1. Save or screenshot your unique pickup code above<br>
                    2. Visit our store during business hours (Mon-Sat, 9AM-6PM)<br>
                    3. Show your pickup code to our staff<br>
                    4. Collect your order - no waiting!<br>
                    <em>Please bring valid ID for verification</em>
                </div>
            </div>
        `;
        
        // Insert delivery options after form
        form.insertAdjacentElement('afterend', deliveryOptions);
    }
    deliveryOptions.classList.add('show');
    
    // Update the form completion check
    const nameInput = document.getElementById('user-name');
    const cityInput = document.getElementById('user-city');
    const phoneInput = document.getElementById('user-phone');
    
    function checkFormCompletion() {
        const nameValue = nameInput.value.trim();
        const cityValue = cityInput.value.trim();
        const phoneValue = phoneInput.value.trim();
        
        // Require ALL three fields to enable WhatsApp button
        const isFormComplete = nameValue && cityValue && phoneValue;
        if (btn) btn.disabled = !isFormComplete;
        
        // Auto-select home delivery by default if not already selected
        if (isFormComplete && !window.deliveryOptionsInitialized) {
            setTimeout(() => {
                selectDeliveryOption('delivery');
                window.deliveryOptionsInitialized = true;
            }, 100);
        }
    }
    
    // Add event listeners to ALL three inputs
    if (nameInput && cityInput && phoneInput) {
        nameInput.addEventListener('input', checkFormCompletion);
        cityInput.addEventListener('input', checkFormCompletion);
        phoneInput.addEventListener('input', checkFormCompletion);
        
        // Initial check
        setTimeout(checkFormCompletion, 100);
    }
    
    // Initialize pickup code if not already done
    if (!window.currentPickupCode) {
        window.currentPickupCode = generatePickupCode();
        const pickupCodeElement = document.getElementById('pickup-code');
        if (pickupCodeElement) {
            pickupCodeElement.textContent = window.currentPickupCode;
        }
    }
    
    // --- Attach Event Listeners ---
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove "${titleToRemove}" from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });

    // Attach the WhatsApp logic to the button
    if (btn) {
        btn.onclick = sendOrderViaWhatsApp;
    }
}

// 🚀 OPTIMIZED WhatsApp Order Sender (FASTER)
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
    
    console.log('WhatsApp URL:', whatsappURL);
    
    // 9. OPTIMIZED: Direct WhatsApp opening with immediate feedback
    const openWhatsApp = () => {
        // Try direct window location first (fastest)
        window.location.href = whatsappURL;
        
        // Show immediate feedback
        setTimeout(() => {
            alert(`✅ Order #${orderId} sent!\n\nWe'll confirm your order shortly.`);
            localStorage.removeItem('de_cart');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 500);
    };

    // Try popup first, then fallback immediately
    const newWindow = window.open(whatsappURL, '_blank');
    
    if (!newWindow) {
        // If popup blocked, use direct method immediately
        openWhatsApp();
    } else {
        // If popup worked, show success message after short delay
        setTimeout(() => {
            alert(`✅ Order #${orderId} sent!\n\nWe'll confirm your order shortly.`);
            localStorage.removeItem('de_cart');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }, 300);
    }
}

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
        orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    }

    // Save to localStorage
    const newOrder = {
        id: orderId,
        orderDate: new Date().toISOString(),
        status: 'pending',
        ...orderData
    };

    const existingOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem('de_order_history', JSON.stringify(existingOrders));

    return orderId;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', renderCart);
