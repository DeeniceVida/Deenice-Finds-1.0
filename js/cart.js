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

    if (!list) return;

    // Apply basic mobile layout styles
    document.body.style.padding = '16px';
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';

    if (cart.length === 0) {
        list.innerHTML = '<p>Your cart is empty.</p>';
        if (btn) btn.style.display = 'none';
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

    // 🟢 NEW: Attach Event Listeners to the Remove Buttons 🟢
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove ${titleToRemove} from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });

    // --- Show name & city form (Original Logic) ---
    const form = document.createElement('div');
    form.innerHTML = `
      <h3>Your Details</h3>
      <label>Name:<br><input id="user-name" type="text" placeholder="Your name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
      <label>City:<br><input id="user-city" type="text" placeholder="Your city" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
    `;
    list.insertAdjacentElement('afterend', form);

    // --- WhatsApp Button Logic (Original Logic) ---
    if (btn) {
      btn.addEventListener('click', () => {
        const name = document.getElementById('user-name').value.trim();
        const city = document.getElementById('user-city').value.trim();

        if (!name || !city) {
          alert('Please enter your name and city before sending your order.');
          return;
        }

        const cfg = window.DEENICE_CONFIG;
        const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

        const txt = encodeURIComponent(
          `🛍 *New Order from Deenice Finds*\n\n👤 Name: ${name}\n🏙 City: ${city}\n\n📦 Items:\n` +
          cart.map(i =>
            `- ${i.title} x${i.qty} (${i.color || 'Default'}) - ${i.price.toLocaleString()}${i.currency}`
          ).join('\n') +
          `\n\nTotal: ${total.toLocaleString()} ${cart[0]?.currency || 'KES'}`
        );

        window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`, '_blank');
      });
    }
}

// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
