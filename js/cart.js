// Cart Data
let cart = JSON.parse(localStorage.getItem('deeniceFindsCart')) || [];

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
    setupCartEventListeners();
});

// Setup Cart Event Listeners
function setupCartEventListeners() {
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutViaWhatsApp);
    }
}

// Add to Cart
function addToCart(product, color, quantity) {
    const existingItem = cart.find(item => 
        item.id === product.id && item.color === color
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            color: color,
            quantity: quantity,
            image: product.images[0]
        });
    }
    
    // Save to localStorage
    saveCartToStorage();
    
    // Update UI
    updateCartUI();
    
    // Show confirmation
    showCartNotification(`${quantity} ${product.name} (${color}) added to cart!`);
}

// Remove from Cart
function removeFromCart(id, color) {
    cart = cart.filter(item => !(item.id === id && item.color === color));
    saveCartToStorage();
    updateCartUI();
}

// Update Cart Item Quantity
function updateCartItemQuantity(id, color, change) {
    const item = cart.find(item => item.id === id && item.color === color);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(id, color);
        } else {
            saveCartToStorage();
            updateCartUI();
        }
    }
}

// Update Cart UI
function updateCartUI() {
    updateCartCount();
    updateCartItems();
    updateCartTotal();
}

// Update Cart Count
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Update Cart Items
function updateCartItems() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="products.html" class="slide-button">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-color">Color: ${item.color}</div>
                <div class="cart-item-price">KES ${item.price.toLocaleString()} x ${item.quantity}</div>
                <div class="cart-item-total">Total: KES ${itemTotal.toLocaleString()}</div>
                <div class="cart-item-quantity">
                    <button class="decrease-quantity" data-id="${item.id}" data-color="${item.color}">-</button>
                    <span>${item.quantity}</span>
                    <button class="increase-quantity" data-id="${item.id}" data-color="${item.color}">+</button>
                </div>
                <div class="cart-item-remove" data-id="${item.id}" data-color="${item.color}">Remove</div>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    // Add event listeners to cart item buttons
    setupCartItemEvents();
}

// Setup Cart Item Events
function setupCartItemEvents() {
    // Decrease quantity buttons
    document.querySelectorAll('.decrease-quantity').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const color = this.getAttribute('data-color');
            updateCartItemQuantity(id, color, -1);
        });
    });
    
    // Increase quantity buttons
    document.querySelectorAll('.increase-quantity').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const color = this.getAttribute('data-color');
            updateCartItemQuantity(id, color, 1);
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const color = this.getAttribute('data-color');
            removeFromCart(id, color);
        });
    });
}

// Update Cart Total
function updateCartTotal() {
    const cartTotalPrice = document.getElementById('cart-total-price');
    if (!cartTotalPrice) return;
    
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = `KES ${totalPrice.toLocaleString()}`;
}

// Save Cart to Local Storage
function saveCartToStorage() {
    localStorage.setItem('deeniceFindsCart', JSON.stringify(cart));
}

// Checkout via WhatsApp
function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    let message = "Hello! I would like to place an order from Deenice Finds:%0A%0A";
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.color}) x ${item.quantity} - KES ${(item.price * item.quantity).toLocaleString()}%0A`;
    });
    
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    message += `%0ATotal: KES ${totalPrice.toLocaleString()}%0A%0APlease proceed with the order.`;
    
    window.open(`https://wa.me/254106590617?text=${encodeURIComponent(message)}`, '_blank');
}

// Show Cart Notification
function showCartNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Clear Cart
function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartUI();
}

// Get Cart Total Items
function getCartTotalItems() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Get Cart Total Price
function getCartTotalPrice() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Export functions for use in other files
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.getCartTotalItems = getCartTotalItems;
window.getCartTotalPrice = getCartTotalPrice;