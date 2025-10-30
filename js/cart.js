// --- Global Cart Logic ---
// Use a function to manage data retrieval and saving
function getCart() {
    return JSON.parse(localStorage.getItem('de_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('de_cart', JSON.stringify(cart));
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

// 🚀 NEW FUNCTION: WhatsApp Order Sender 🚀
function sendOrderViaWhatsApp() {
    const cart = getCart();
    
    // 1. Get user details (with basic validation)
    const name = document.getElementById('user-name') ? document.getElementById('user-name').value.trim() : '';
    const city = document.getElementById('user-city') ? document.getElementById('user-city').value.trim() : '';

    if (!name || !city) {
        alert("Please enter your Name and City before sending the order.");
        return;
    }

    // 2. Build the order message
    let total = 0;
    let message = `*✨ New Order from Deenice Finds!*

*Customer Details:*
Name: ${name}
City: ${city}
---
*Order Items:*
`;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        let details = [];
        if (item.color) details.push(`Color: ${item.color}`);
        if (item.size) details.push(`Size: ${item.size}`);
        // 🟢 Include Model option if available
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

    // 3. Get WhatsApp Number (Ensure config.js has a 'whatsappNumber' variable)
    // NOTE: I am using 'whatsappNumber' which should be defined in your config.js
    if (typeof whatsappNumber === 'undefined') {
        alert("Error: WhatsApp number is not configured (check js/config.js).");
        console.error("WhatsApp number (whatsappNumber) is missing from config.js");
        return;
    }
    
    // 4. Encode the message and open the link
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
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


    // Build the cart HTML (same as before)
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
                background-color:#dc3545; /* Red for removal */
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


    // Only insert the form if it doesn't already exist in the DOM
    if (!existingForm) {
        const form = document.createElement('div');
        form.innerHTML = `
            <h3>Your Details</h3>
            <label>Name:<br><input id="user-name" type="text" placeholder="Your name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
            <label>City:<br><input id="user-city" type="text" placeholder="Your city" required style="width:100%;padding:8px;margin-bottom:20px;"></label>
        `;
        list.insertAdjacentElement('afterend', form);
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

    // 🔑 NEW: Attach the WhatsApp logic to the button 🔑
    if (btn) {
        btn.removeEventListener('click', sendOrderViaWhatsApp); // Prevent duplicates
        btn.addEventListener('click', sendOrderViaWhatsApp);
    }
}
// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
