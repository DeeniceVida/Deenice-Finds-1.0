// --- Global Cart Logic ---
// Use a function to manage data retrieval and saving
function getCart() {
    return JSON.parse(localStorage.getItem('de_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('de_cart', JSON.stringify(cart));
}

// 🟢 NEW: Item Removal Function 🟢
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

// --- Cart Renderer (Extracted into a function for re-use) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();

    // Find the existing form container by its first input element
    const existingForm = document.getElementById('user-name') ? document.getElementById('user-name').closest('div') : null;

    if (!list) return;

    // Apply basic mobile layout styles
    document.body.style.padding = '16px';
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';

    if (cart.length === 0) {
        list.innerHTML = '<p>Your cart is empty.</p>';
        if (btn) btn.style.display = 'none';
        
        // 🟢 FIX 1: Hide the form when the cart is empty 🟢
        if (existingForm) {
            existingForm.style.display = 'none';
        }
        return;
    }

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
                <small>${it.color || ''}</small><br>
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

    // 🟢 NEW: Ensure the form is visible when the cart is NOT empty 🟢
    if (existingForm) {
        existingForm.style.display = 'block';
    }


    // 🟢 FIX 2: Prevent the form from being inserted multiple times 🟢
    // Only insert the form if it doesn't already exist in the DOM
    if (!existingForm) {
        const form = document.createElement('div');
        form.innerHTML = `
          <h3>Your Details</h3>
          <label>Name:<br><input id="user-name" type="text" placeholder="Your name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
          <label>City:<br><input id="user-city" type="text" placeholder="Your city" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
        `;
        list.insertAdjacentElement('afterend', form);
    }
    
    // --- Attach Event Listeners to the Remove Buttons (Same as before) ---
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove ${titleToRemove} from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });
}
// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
