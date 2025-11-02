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

// 🚀 UPDATED FUNCTION: iOS-Compatible WhatsApp Order Sender
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

    // 2. Create order first to get order ID
    const orderId = await saveOrderToHistory(cart, {
        method: window.selectedDeliveryOption,
        city: city,
        customer: { name, city, phone }
    });

    // 3. Build message with order ID
    let total = 0;
    let message = `*✨ New Order from Deenice Finds!*\n\n`;
    message += `*Order ID:* ${orderId}\n`;
    message += `*Customer:* ${name}\n`;
    message += `*City:* ${city}\n`;
    message += `*Delivery:* ${window.selectedDeliveryOption === 'pickup' ? '🏪 Pick Up in Shop' : '🚚 Home Delivery'}\n`;

    if (window.selectedDeliveryOption === 'pickup' && window.currentPickupCode) {
        message += `*Pickup Code:* ${window.currentPickupCode}\n`;
    }

    message += `\n*Order Items:*\n`;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
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

    // 4. iOS-Compatible WhatsApp Opening
    const config = window.DEENICE_CONFIG || {};
    let whatsappNumber = config.whatsappNumber;

    if (!whatsappNumber) {
        alert("Error: WhatsApp number is not configured.");
        return;
    }
    
    whatsappNumber = whatsappNumber.replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    
    // iOS-Compatible WhatsApp URL
    const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    // iOS-Safe Link Opening
    setTimeout(() => {
        // Method 1: Try direct window.location (works better on iOS)
        window.location.href = whatsappURL;
    }, 100);
    
    // Fallback: Show manual instructions if redirect fails
    setTimeout(() => {
        // If we're still on the same page after 2 seconds, show manual option
        if (window.location.href.indexOf('whatsapp') === -1) {
            const manualSend = confirm(
                "WhatsApp didn't open automatically.\n\n" +
                "Click OK to copy the message, then:\n" +
                "1. Open WhatsApp manually\n" +
                "2. Paste the message to Deenice Finds\n" +
                "3. Send the order"
            );
            
            if (manualSend) {
                // Copy message to clipboard
                navigator.clipboard.writeText(message).then(() => {
                    alert("✅ Order message copied to clipboard!\n\n📱 Now open WhatsApp and paste the message to Deenice Finds.");
                }).catch(() => {
                    // Fallback if clipboard fails
                    prompt("📋 Copy this order message and send it to Deenice Finds on WhatsApp:", message);
                });
            }
        }
    }, 2000);
    
    // 5. Show confirmation
    setTimeout(() => {
        alert(`✅ Order #${orderId} prepared!\n\n📋 Status: Pending\n\nWe'll notify you when your order status updates.`);
    }, 500);
}

// --- Cart Renderer (Modified to attach WhatsApp listener) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();
    const summaryContainer = document.getElementById('cart-summary');

    // Find the existing form container by its first input element
    const existingForm = document.getElementById('user-name') ? document.getElementById('user-name').closest('div') : null;

    if (!list || !summaryContainer) return;

    // Apply basic mobile layout styles
    document.body.style.padding = '16px';
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';

    if (cart.length === 0) {
        list.innerHTML = '<p>Your cart is empty.</p>';
        summaryContainer.innerHTML = '';
        if (btn) btn.style.display = 'none';
        
        // Hide delivery options if they exist
        const deliveryOptions = document.getElementById('delivery-options');
        if (deliveryOptions) {
            deliveryOptions.style.display = 'none';
            deliveryOptions.classList.remove('show');
        }
        
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
        <h2 style="text-align:right;">Total: ${currency} ${total.toLocaleString()}</h2>
    `;

    // Build the cart HTML
    let html = `
        <ul style="list-style:none;padding:0;margin:0;">
          ${cart.map(it => `
            <li class="cart-item" data-product-title="${it.title}" style="
              display:flex;
              align-items:center;
              gap:12px;
              padding:12px 0;
              border-bottom:1px solid #eee;
            ">
              <img src="${it.img || 'https://via.placeholder.com/60'}" alt="${it.title}" 
                style="width:60px;height:60px;object-fit:cover;border-radius:8px;" />
              <div style="flex:1;">
                <strong>${it.title}</strong><br>
                <small>
                    ${it.color || ''} 
                    ${it.size ? `/ ${it.size}` : ''}
                    ${it.model && it.model !== 'Standard' ? `/ ${it.model}` : ''}
                </small><br>
                <span>${it.qty} × ${it.price.toLocaleString()} ${it.currency}</span>
              </div>
              <button class="remove-from-cart-btn" data-item-title="${it.title}" style="
                background-color:#dc3545;
                color:white;
                border:none;
                padding:5px 10px;
                border-radius:4px;
                cursor:pointer;
                font-size:0.8em;
                margin-left:10px;
                flex-shrink:0;
              ">
                Remove
              </button>
            </li>
          `).join('')}
        </ul>
    `;

    list.innerHTML = html;
    if (btn) btn.style.display = 'block';

    // Hide delivery options initially
    const deliveryOptions = document.getElementById('delivery-options');
    if (deliveryOptions) {
        deliveryOptions.style.display = 'none';
        deliveryOptions.classList.remove('show');
    }

    if (existingForm) {
        existingForm.style.display = 'block';
        // Check if form is already filled to show delivery options
        const nameValue = document.getElementById('user-name').value.trim();
        const cityValue = document.getElementById('user-city').value.trim();
        const deliveryOptions = document.getElementById('delivery-options');
        if (nameValue && cityValue && deliveryOptions) {
            deliveryOptions.style.display = 'block';
            deliveryOptions.classList.add('show');
            // Auto-select home delivery by default
            if (!window.deliveryOptionsInitialized) {
                setTimeout(() => {
                    selectDeliveryOption('delivery');
                    window.deliveryOptionsInitialized = true;
                }, 100);
            }
        }
    }

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
    list.insertAdjacentElement('afterend', form);
    
    // Update the form completion check to include phone
    const nameInput = document.getElementById('user-name');
    const cityInput = document.getElementById('user-city');
    const phoneInput = document.getElementById('user-phone');
    
    function checkFormCompletion() {
        const nameValue = nameInput.value.trim();
        const cityValue = cityInput.value.trim();
        const phoneValue = phoneInput.value.trim();
        const deliveryOptions = document.getElementById('delivery-options');
        
        // Require ALL three fields to show delivery options
        if (nameValue && cityValue && phoneValue && deliveryOptions) {
            deliveryOptions.style.display = 'block';
            deliveryOptions.classList.add('show');
            // Auto-select home delivery by default
            if (!window.deliveryOptionsInitialized) {
                setTimeout(() => {
                    selectDeliveryOption('delivery');
                    window.deliveryOptionsInitialized = true;
                }, 100);
            }
        } else if (deliveryOptions) {
            deliveryOptions.style.display = 'none';
            deliveryOptions.classList.remove('show');
        }
    }
    
    // Add event listeners to ALL three inputs
    nameInput.addEventListener('input', checkFormCompletion);
    cityInput.addEventListener('input', checkFormCompletion);
    phoneInput.addEventListener('input', checkFormCompletion);
    
    // Also add validation feedback for phone
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
            // Also check form completion on each input
            checkFormCompletion();
        });
    });
    
    // Initial check in case there are existing values
    setTimeout(checkFormCompletion, 100);
}
    
    // --- Attach Event Listeners ---
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove ${titleToRemove} from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });

    // Attach the WhatsApp logic to the button
    if (btn) {
        btn.removeEventListener('click', sendOrderViaWhatsApp);
        btn.addEventListener('click', sendOrderViaWhatsApp);
    }
}
// Add this function to your cart.js file
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
        phone: document.getElementById('user-phone')?.value || '' // Add this
    }
};
    let orderId;

    try {
        // 1. FIRST: Save to Backend
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
            orderId = backendData.order.id;
            console.log('✅ Order saved to backend:', orderId);
        } else {
            throw new Error('Backend save failed');
        }
    } catch (error) {
        console.error('❌ Backend save failed, using fallback:', error);
        // Fallback: Generate local order ID
        orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    }

    // 2. ALSO save to localStorage (for compatibility)
    const newOrder = {
        id: orderId,
        orderDate: new Date().toISOString(),
        status: 'pending',
        ...orderData
    };

    // Save to order history (localStorage)
    if (typeof addOrderToHistory === 'function') {
        addOrderToHistory(newOrder);
    } else {
        // Fallback: save directly to localStorage
        const existingOrders = JSON.parse(localStorage.getItem('de_order_history') || '[]');
        existingOrders.unshift(newOrder);
        localStorage.setItem('de_order_history', JSON.stringify(existingOrders));
    }

    // Clear cart after successful order
    localStorage.removeItem('de_cart');

    return orderId;
}

// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
