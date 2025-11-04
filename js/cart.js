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

// --- Cart Renderer (Fixed for existing HTML) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();
    const summaryContainer = document.getElementById('cart-summary');
    const deliveryOptions = document.getElementById('delivery-options');

    if (!list || !summaryContainer) {
        console.error('Cart elements not found');
        return;
    }

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Your cart is empty.</p>';
        summaryContainer.innerHTML = '';
        if (btn) btn.style.display = 'none';
        if (deliveryOptions) deliveryOptions.style.display = 'none';
        
        // Hide form if it exists
        const existingForm = document.getElementById('user-name')?.closest('.premium-form');
        if (existingForm) {
            existingForm.style.display = 'none';
        }
        return;
    }

    // --- Calculate Total and Display Summary ---
    let total = 0;
    const currency = cart[0].currency;
    cart.forEach(item => {
        total += item.price * item.qty;
    });

    summaryContainer.innerHTML = `
        <div class="cart-summary">
            <h2>Total: ${currency} ${total.toLocaleString()}</h2>
        </div>
    `;

    // Build the cart HTML
    let html = `
        <div class="cart-items-container">
            <ul class="cart-items-list">
                ${cart.map(item => `
                    <li class="cart-item" data-product-title="${item.title}">
                        <img src="${item.img || 'https://via.placeholder.com/80'}" alt="${item.title}" class="cart-item-image" />
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
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    list.innerHTML = html;
    if (btn) btn.style.display = 'block';

    // Show delivery options
    if (deliveryOptions) {
        deliveryOptions.style.display = 'block';
    }

    // Check if form already exists
    const existingForm = document.getElementById('user-name')?.closest('.premium-form');
    
    // Only insert the form if it doesn't already exist in the DOM
    if (!existingForm) {
        const form = document.createElement('div');
        form.className = 'premium-form';
        form.innerHTML = `
            <h3>👤 Your Details</h3>
            <div class="form-group input-icon name">
                <input type="text" 
                       id="user-name" 
                       class="premium-input" 
                       placeholder="Enter your full name" 
                       required 
                       pattern="[A-Za-z\\s]{2,}">
            </div>
            <div class="form-group input-icon city">
                <input type="text" 
                       id="user-city" 
                       class="premium-input" 
                       placeholder="Enter your city/town" 
                       required 
                       pattern="[A-Za-z\\s]{2,}">
            </div>
            <div class="form-group input-icon phone">
                <input type="tel" 
                       id="user-phone" 
                       class="premium-input" 
                       placeholder="e.g., 254712345678" 
                       required 
                       pattern="[0-9]{10,12}">
                <small style="display:block; color:#666; margin-top:5px; font-size:12px;">
                    Enter your WhatsApp number without + or 0 (e.g., 254712345678)
                </small>
            </div>
        `;
        
        // Insert form after cart contents but before delivery options
        if (deliveryOptions) {
            deliveryOptions.insertAdjacentElement('beforebegin', form);
        } else {
            list.insertAdjacentElement('afterend', form);
        }
        
        // Update the form completion check
        const nameInput = document.getElementById('user-name');
        const cityInput = document.getElementById('user-city');
        const phoneInput = document.getElementById('user-phone');
        
        function checkFormCompletion() {
            const nameValue = nameInput.value.trim();
            const cityValue = cityInput.value.trim();
            const phoneValue = phoneInput.value.trim();
            
            // Require ALL three fields to enable WhatsApp button
            if (nameValue && cityValue && phoneValue) {
                if (btn) btn.disabled = false;
                // Auto-select home delivery by default if not already selected
                if (!window.deliveryOptionsInitialized) {
                    setTimeout(() => {
                        selectDeliveryOption('delivery');
                        window.deliveryOptionsInitialized = true;
                    }, 100);
                }
            } else {
                if (btn) btn.disabled = true;
            }
        }
        
        // Add event listeners to ALL three inputs
        nameInput.addEventListener('input', checkFormCompletion);
        cityInput.addEventListener('input', checkFormCompletion);
        phoneInput.addEventListener('input', checkFormCompletion);
        
        // Also add validation feedback
        const inputs = form.querySelectorAll('.premium-input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.validity.valid) {
                    this.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                } else if (this.value.length > 0) {
                    this.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                } else {
                    this.style.borderColor = 'rgba(15, 20, 30, 0.1)';
                }
                checkFormCompletion();
            });
        });
        
        // Initial check
        setTimeout(checkFormCompletion, 100);
    } else {
        // Form already exists, just check completion
        const nameInput = document.getElementById('user-name');
        const cityInput = document.getElementById('user-city');
        const phoneInput = document.getElementById('user-phone');
        
        if (nameInput && cityInput && phoneInput && btn) {
            function checkExistingForm() {
                const nameValue = nameInput.value.trim();
                const cityValue = cityInput.value.trim();
                const phoneValue = phoneInput.value.trim();
                
                btn.disabled = !(nameValue && cityValue && phoneValue);
            }
            
            nameInput.addEventListener('input', checkExistingForm);
            cityInput.addEventListener('input', checkExistingForm);
            phoneInput.addEventListener('input', checkExistingForm);
            
            checkExistingForm();
        }
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
        // Initially disable the button until form is filled
        btn.disabled = true;
    }

    // Auto-select delivery option if not already selected
    if (!window.selectedDeliveryOption && window.deliveryOptionsInitialized) {
        selectDeliveryOption('delivery');
    }
}

// 🚀 WhatsApp Order Sender (keep the fixed version from previous response)
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
    
    // 9. Open WhatsApp
    let whatsappOpened = false;
    const newWindow = window.open(whatsappURL, '_blank');
    if (newWindow) {
        whatsappOpened = true;
    }
    
    setTimeout(() => {
        if (!whatsappOpened) {
            window.location.href = whatsappURL;
            whatsappOpened = true;
        }
    }, 100);
    
    setTimeout(() => {
        if (!whatsappOpened) {
            const manualSend = confirm(
                "WhatsApp didn't open automatically.\n\nClick OK to copy the order message."
            );
            
            if (manualSend) {
                navigator.clipboard.writeText(message).then(() => {
                    alert("✅ Order message copied to clipboard!\n\n📱 Now open WhatsApp and send it to Deenice Finds.");
                }).catch(() => {
                    prompt("📋 Copy this order message to WhatsApp:", message);
                });
            }
        }
    }, 2000);
    
    // 10. Show success message and clear cart
    setTimeout(() => {
        alert(`✅ Order #${orderId} sent!\n\nWe'll confirm your order shortly.`);
        localStorage.removeItem('de_cart');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }, 500);
}

// Keep the saveOrderToHistory function from previous response
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
