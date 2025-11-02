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
    event.currentTarget.classList.add('selected');
    
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

// 🚀 UPDATED FUNCTION: WhatsApp Order Sender with Delivery Options 🚀
function sendOrderViaWhatsApp() {
    const cart = getCart();
    
    // 1. Get user details (with basic validation)
    const name = document.getElementById('user-name') ? document.getElementById('user-name').value.trim() : '';
    const city = document.getElementById('user-city') ? document.getElementById('user-city').value.trim() : '';

    if (!name || !city) {
        alert("Please enter your Name and City before sending the order.");
        return;
    }
    
    // 🆕 Check if delivery option is selected
    if (!window.selectedDeliveryOption) {
        alert("Please select a delivery option (Home Delivery or Pick Up in Shop).");
        return;
    }

    // 2. Build the order message
    let total = 0;
    let message = `*✨ New Order from Deenice Finds!*

*Customer Details:*
Name: ${name}
City: ${city}
`;

    // 🆕 Add delivery information
    if (window.selectedDeliveryOption === 'pickup') {
        message += `Delivery: 🏪 Pick Up in Shop\n`;
        message += `Pickup Code: ${window.currentPickupCode}\n`;
    } else {
        message += `Delivery: 🚚 Home Delivery\n`;
    }

    message += `---
*Order Items:*
`;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        let details = [];
        if (item.color) details.push(`Color: ${item.color}`);
        if (item.size) details.push(`Size: ${item.size}`);
        if (item.model && item.model !== 'Standard') details.push(`Model: ${item.model}`);

        message += `${index + 1}. ${item.title}
   - Qty: ${item.qty}
   - Price: ${item.currency} ${item.price.toLocaleString()}
   - Specs: ${details.join(' / ')}
   - Subtotal: ${item.currency} ${itemTotal.toLocaleString()}
`;
    });

    message += `
---
*Total Amount: ${cart[0].currency} ${total.toLocaleString()}*
`;

    // 🆕 Add pickup instructions if applicable
    if (window.selectedDeliveryOption === 'pickup') {
        message += `
*🏪 PICKUP INSTRUCTIONS:*
• Store: Dynamic Mall, Shop ML 135, 3rd Floor
• Location: Tom Mboya Street, Behind National Archives
• Hours: Monday-Saturday, 9AM-6PM
• Bring: This pickup code and valid ID
• Code: ${window.currentPickupCode}
`;
    }

    // 3. Get WhatsApp Number from the global configuration object
    const config = window.DEENICE_CONFIG || {};
    let whatsappNumber = config.whatsappNumber;

    if (!whatsappNumber) {
        alert("Error: WhatsApp number is not configured (check js/config.js).");
        console.error("WhatsApp number is missing from DEENICE_CONFIG.");
        return;
    }
    
    // 4. Clean the number and Encode the message
    whatsappNumber = whatsappNumber.replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    
    // 5. Create WhatsApp URL
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    
    // 🆕 Show confirmation message with pickup details
    if (window.selectedDeliveryOption === 'pickup') {
        setTimeout(() => {
            alert(`✅ Order sent successfully!\n\n📋 Your Pickup Code: ${window.currentPickupCode}\n\n📍 Store Location: Dynamic Mall, Shop ML 135, 3rd Floor\n⏰ Hours: Mon-Sat, 9AM-6PM\n\nPlease save your pickup code for collection.`);
        }, 1000);
    }
}

// --- Cart Renderer (Modified to attach WhatsApp listener) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();
    const summaryContainer = document.getElementById('cart-summary');
    const deliveryOptions = document.getElementById('delivery-options');

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
        if (deliveryOptions) deliveryOptions.style.display = 'none';
        
        if (existingForm) {
            existingForm.style.display = 'none';
        }
        return;
    }

    // Show delivery options when cart has items
    if (deliveryOptions) {
        deliveryOptions.style.display = 'block';
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

    if (existingForm) {
        existingForm.style.display = 'block';
    }

    // 🆕 PREMIUM FORM: Only insert the form if it doesn't already exist in the DOM
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
                       placeholder="Enter your city" 
                       required 
                       pattern="[A-Za-z\\s]{2,}">
            </div>
        `;
        list.insertAdjacentElement('afterend', form);
        
        // Add real-time validation feedback
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
            });
        });
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
    
    // 🆕 Initialize delivery options
    if (deliveryOptions && !window.deliveryOptionsInitialized) {
        // Auto-select home delivery by default
        setTimeout(() => {
            selectDeliveryOption('delivery');
            window.deliveryOptionsInitialized = true;
        }, 100);
    }
}

// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
