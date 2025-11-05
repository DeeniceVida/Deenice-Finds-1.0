// product-page.js - FOR SINGLE PRODUCT DETAIL PAGE (WITH DESCRIPTION COLLAPSE & FIXED ADD TO CART)
(async () => {
    // 1. Initial Setup and Parameter Retrieval
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const container = document.getElementById('product-page');

    console.log('🔄 Loading product page for ID:', id);

    let products = [];
    let product = null;

    // 2. Fetch Data with Enhanced Error Handling
    try {
        // Try to load from storefront_products first (admin updates)
        const storefrontProducts = localStorage.getItem('storefront_products');
        
        if (storefrontProducts) {
            products = JSON.parse(storefrontProducts);
            console.log('📦 Loaded products from storefront cache:', products.length);
        } else {
            // Fallback to original JSON file
            console.log('📦 No storefront cache, loading from JSON...');
            const res = await fetch('data/products.json');
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            products = await res.json();
            console.log('📦 Loaded products from JSON file:', products.length);
        }

        // Find the product by ID, fallback to the first product if not found
        product = products.find(x => x.id === id) || products[0];
        
        if (!product) {
            throw new Error('Product not found');
        }

        console.log('✅ Found product:', product.title);

    } catch (error) {
        console.error("❌ Error loading product data:", error);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="margin-bottom: 10px; font-weight: bold;">Error Loading Product</div>
                    <p style="margin-bottom: 20px;">${error.message || 'Please check your connection and try again.'}</p>
                    <button onclick="location.reload()" 
                            style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
        return;
    }

    // Stop if no product or container found
    if (!product || !container) {
        console.error("❌ Product or container element not found.");
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>Product not found. Please try another product.</p>
            </div>
        `;
        return;
    }

    // 3. Initialize Variables
    let currentPrice = product.sizes && product.sizes.length > 0 ? product.sizes[0].price : product.price;
    let selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0].label : null;
    let selectedModel = product.models && product.models.length > 0 ? product.models[0] : null;
    let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0].name : null;

    // Calculate available stock
    function getAvailableStock(product) {
        if (product.colorStock && Object.keys(product.colorStock).length > 0) {
            return Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0);
        }
        return product.stock || 0;
    }

    const initialStock = getAvailableStock(product);
    const hasDiscount = product.originalPrice && product.originalPrice > currentPrice;
    const discountAmount = hasDiscount ? product.originalPrice - currentPrice : 0;
    const saveText = hasDiscount ? `Save ${product.currency} ${discountAmount.toLocaleString()}` : "";

    // Clean stock status display
    const stockStatus = initialStock > 5 ? 'In Stock' : 
                       initialStock > 0 ? 'Low Stock' : 'Out of Stock';
    const stockClass = initialStock > 5 ? 'in-stock' : 
                      initialStock > 0 ? 'low-stock' : 'out-of-stock';

    // 4. Build Product Page HTML
    container.innerHTML = `
        <div class="product-page-card">
            <div class="product-slideshow">
                <div class="product-main-image-wrapper">
                    <img id="main-image" src="${product.images[0]}" alt="${product.title}" 
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/400x400?text=No+Image';"/>
                </div>
                <div class="product-thumbs">
                    ${product.images.map((im, idx) => `
                        <img data-src="${im}" ${idx === 0 ? 'class="selected"' : ''} src="${im}" 
                             style="cursor: pointer; border: 2px solid ${idx === 0 ? '#007bff' : 'transparent'}; border-radius: 4px;" />
                    `).join('')}
                </div>
            </div>

            <div id="product-details">
                <h2 style="font-weight: 600; color: #1d1d1f; margin-bottom: 15px;">${product.title}</h2>

                <!-- Clean Stock status display -->
                <div class="stock-status ${stockClass}" style="font-weight: 500; padding: 12px; border-radius: 8px; margin: 15px 0; background: ${initialStock > 5 ? '#f0f9f0' : initialStock > 0 ? '#fff8e6' : '#fef0f0'}; border: 1px solid ${initialStock > 5 ? '#d4edda' : initialStock > 0 ? '#ffeaa7' : '#f5c6cb'}; color: ${initialStock > 5 ? '#155724' : initialStock > 0 ? '#856404' : '#721c24'};">
                    <strong>${stockStatus}</strong>
                    ${initialStock > 0 && initialStock <= 5 ? `<div style="font-size: 0.9em; margin-top: 5px; font-weight: normal;">Only ${initialStock} items remaining</div>` : ''}
                </div>

                <div class="price-section" style="margin: 20px 0;">
                    <span id="product-price" class="current-price" style="font-size: 1.4em; font-weight: 700; color: #1d1d1f;">${product.currency} ${currentPrice.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="old-price" style="text-decoration: line-through; color: #86868b; margin-left: 10px;">${product.currency} ${product.originalPrice.toLocaleString()}</span>` : ""}
                    ${hasDiscount ? `<span class="discount-tag" style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; margin-left: 10px; font-weight: 500;">${saveText}</span>` : ""}
                </div>

                <!-- Description with collapse feature -->
                <div id="product-description-container" class="description-container">
                    <div class="description-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 15px 0; border-bottom: 1px solid #e5e5e7;">
                        <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: #1d1d1f;">Description</h3>
                        <span id="description-toggle" style="font-size: 1.2em; color: #86868b;">−</span>
                    </div>
                    <div id="description-content" class="description-content" style="padding: 15px 0; max-height: 200px; overflow: hidden; transition: max-height 0.3s ease;">
                        <p style="margin: 0; line-height: 1.6; color: #515154;">${product.description}</p>
                    </div>
                </div>

                ${product.colors && product.colors.length > 0 ? `
                <div id="color-selector" style="margin: 25px 0;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #1d1d1f;">Color:</label>
                    <div class="color-options" style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${product.colors.map((c, idx) => {
                            const isAvailable = !product.availableColors || product.availableColors.includes(c.name);
                            const isOutOfStock = initialStock === 0;
                            
                            return `
                            <div class="color-item" style="text-align: center;">
                                <div class="color-name" style="font-size: 0.85em; margin-bottom: 6px; color: #515154;">${c.name} ${isOutOfStock ? '(Out of Stock)' : !isAvailable ? '(Unavailable)' : ''}</div>
                                <div class="color-option ${idx === 0 && isAvailable && !isOutOfStock ? 'selected' : ''} 
                                    ${!isAvailable || isOutOfStock ? 'disabled' : ''}" 
                                    data-img="${c.img}" 
                                    data-name="${c.name}"
                                    style="width: 60px; height: 60px; border: 2px solid ${idx === 0 && isAvailable && !isOutOfStock ? '#007bff' : '#e5e5e7'}; border-radius: 10px; padding: 2px; cursor: ${!isAvailable || isOutOfStock ? 'not-allowed' : 'pointer'}; opacity: ${!isAvailable || isOutOfStock ? '0.5' : '1'}; transition: all 0.2s ease;">
                                    <img src="${c.img}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                ` : ''}

                ${product.sizes && product.sizes.length > 0 ? `
                <div class="size-options-container" style="margin: 25px 0;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #1d1d1f;">Choose size:</label>
                    <div class="size-buttons" id="size-buttons-group" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${product.sizes.map((s, idx) => `
                            <button class="size-button ${idx === 0 ? 'selected' : ''}"
                                    data-size="${s.label}"
                                    data-price="${s.price}"
                                    style="padding: 12px 18px; border: 2px solid ${idx === 0 ? '#007bff' : '#e5e5e7'}; background: ${idx === 0 ? '#007bff' : 'white'}; color: ${idx === 0 ? 'white' : '#1d1d1f'}; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s ease;">
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${product.models && product.models.length > 0 ? `
                <div class="model-options-container" style="margin: 25px 0;">
                    <label for="model-selector" style="display: block; margin-bottom: 12px; font-weight: 600; color: #1d1d1f;">Choose Model:</label>
                    <select id="model-selector" class="product-option-select" style="padding: 12px; border: 1px solid #e5e5e7; border-radius: 8px; width: 100%; max-width: 300px; background: white; color: #1d1d1f; font-size: 1em;">
                        ${product.models.map((model, idx) => `
                            <option value="${model}" ${idx === 0 ? 'selected' : ''}>
                                ${model}
                            </option>
                        `).join('')}
                    </select>
                </div>` : ''}

                <!-- Quantity input with stock validation -->
                <div class="quantity-container" style="margin: 25px 0;">
                    <label for="qty" style="display: block; margin-bottom: 12px; font-weight: 600; color: #1d1d1f;">Quantity:</label>
                    <input id="qty" type="number" value="1" min="1" max="${initialStock}" 
                           style="padding: 12px; border: 1px solid #e5e5e7; border-radius: 8px; width: 100px; text-align: center; font-size: 1em; color: #1d1d1f;"
                           onchange="validateQuantity(this, ${initialStock})" />
                    <div id="quantity-error" class="error-message" style="display: none; color: #ff3b30; font-size: 0.9em; margin-top: 5px;"></div>
                </div>

                <!-- Premium Add to Cart Button -->
                <button id="add-cart" class="add-to-cart-btn primary" ${initialStock === 0 ? 'disabled' : ''}
                        style="padding: 18px 30px; 
                               background: ${initialStock === 0 ? '#8E8E93' : '#007bff'}; 
                               color: white; 
                               border: none; 
                               border-radius: 12px; 
                               font-size: 1.1em; 
                               cursor: ${initialStock === 0 ? 'not-allowed' : 'pointer'}; 
                               width: 100%; 
                               max-width: 350px; 
                               font-weight: 600; 
                               transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                               box-shadow: ${initialStock === 0 ? 'none' : '0 4px 20px rgba(0, 123, 255, 0.3)'};
                               opacity: ${initialStock === 0 ? '0.6' : '1'};">
                    ${initialStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                ${initialStock > 0 && initialStock <= 5 ? `
                    <div class="stock-notice" style="margin-top: 15px; text-align: center; color: #856404; font-size: 0.9em; font-style: italic;">
                        Limited availability. Recommended to complete your purchase soon.
                    </div>
                ` : ''}
                
                ${initialStock === 0 ? `
                    <div class="out-of-stock-message" style="margin-top: 15px; text-align: center; color: #721c24; font-size: 0.9em;">
                        This item is currently out of stock. Please check back later.
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    console.log('✅ Product page rendered successfully');

    // 5. Setup Event Listeners
    setupProductInteractions();
})();

// Quantity validation function
function validateQuantity(input, maxStock) {
    const quantity = parseInt(input.value);
    const errorElement = document.getElementById('quantity-error');
    const addToCartBtn = document.getElementById('add-cart');
    
    if (isNaN(quantity) || quantity < 1) {
        input.value = 1;
        errorElement.style.display = 'none';
        if (addToCartBtn) addToCartBtn.disabled = false;
        return;
    }
    
    if (quantity > maxStock) {
        errorElement.textContent = `Only ${maxStock} units available. You cannot order more than available stock.`;
        errorElement.style.display = 'block';
        input.value = maxStock;
        if (addToCartBtn) addToCartBtn.disabled = false;
    } else {
        errorElement.style.display = 'none';
        if (addToCartBtn) addToCartBtn.disabled = false;
    }
}

// Description collapse/expand function
function toggleDescription() {
    const descriptionContent = document.getElementById('description-content');
    const descriptionToggle = document.getElementById('description-toggle');
    
    if (descriptionContent && descriptionToggle) {
        if (descriptionContent.style.maxHeight === '0px' || !descriptionContent.style.maxHeight) {
            // Expand
            descriptionContent.style.maxHeight = '200px';
            descriptionContent.style.padding = '15px 0';
            descriptionToggle.textContent = '−';
        } else {
            // Collapse
            descriptionContent.style.maxHeight = '0px';
            descriptionContent.style.padding = '0';
            descriptionToggle.textContent = '+';
        }
    }
}

// Auto-collapse description when color is selected
function collapseDescriptionOnColorSelect() {
    const descriptionContent = document.getElementById('description-content');
    const descriptionToggle = document.getElementById('description-toggle');
    
    if (descriptionContent && descriptionToggle) {
        // Only collapse if not already collapsed
        if (descriptionContent.style.maxHeight !== '0px') {
            descriptionContent.style.maxHeight = '0px';
            descriptionContent.style.padding = '0';
            descriptionToggle.textContent = '+';
        }
    }
}

// Add to cart function (FIXED - now properly handles the product ID)
function addToCart(productId, productTitle, currentPrice, initialStock) {
    const qtyInput = document.getElementById('qty');
    const quantity = parseInt(qtyInput.value);
    const maxStock = parseInt(qtyInput.max);
    
    // Final validation
    if (quantity > maxStock) {
        showNotification(`Cannot add to cart! Only ${maxStock} units available.`, 'error');
        qtyInput.value = maxStock;
        return;
    }
    
    if (quantity < 1) {
        showNotification('Please enter a valid quantity.', 'error');
        qtyInput.value = 1;
        return;
    }

    const colorEl = document.querySelector('.color-option.selected');
    const color = colorEl ? colorEl.dataset.name : 'Default';
    const sizeEl = document.querySelector('.size-button.selected');
    const size = sizeEl ? sizeEl.dataset.size : 'Standard';
    const modelEl = document.getElementById('model-selector');
    const model = modelEl ? modelEl.value : 'Standard';
    
    const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');

    // Get current price
    const priceElement = document.getElementById('product-price');
    const priceText = priceElement ? priceElement.textContent : 'KES 0';
    const price = parseFloat(priceText.replace('KES', '').replace(/,/g, '').trim());

    // Check if item already in cart
    const existingItemIndex = cart.findIndex(item => 
        item.id === productId && 
        item.color === color && 
        item.size === size &&
        item.model === model
    );

    if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newQty = cart[existingItemIndex].qty + quantity;
        if (newQty > maxStock) {
            showNotification(`Cannot add more! You already have ${cart[existingItemIndex].qty} in cart, only ${maxStock} available total.`, 'error');
            return;
        }
        cart[existingItemIndex].qty = newQty;
    } else {
        // Add new item
        cart.push({
            id: productId,
            title: productTitle,
            price: price,
            currency: 'KES',
            qty: quantity,
            color: color,
            size: size,
            model: model,
            img: document.getElementById('main-image') ? document.getElementById('main-image').src : ''
        });
    }

    localStorage.setItem('de_cart', JSON.stringify(cart));
    showNotification(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`, 'success');

    // Update cart count with animation
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalItems = cart.reduce((total, item) => total + item.qty, 0);
        badge.textContent = totalItems;
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 300);
    }
}

// Premium notification system instead of alerts
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#FF3B30' : '#007AFF'};
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function setupProductInteractions() {
    console.log('🔄 Setting up product interactions...');
    
    // Description toggle
    const descriptionHeader = document.querySelector('.description-header');
    if (descriptionHeader) {
        descriptionHeader.addEventListener('click', toggleDescription);
        // Add touch event for mobile
        descriptionHeader.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleDescription();
        }, { passive: false });
        console.log('✅ Description toggle listener added');
    }

    // Thumbnail switching
    const thumbnails = document.querySelectorAll('.product-thumbs img');
    if (thumbnails.length > 0) {
        thumbnails.forEach(img => {
            // Click event
            img.addEventListener('click', () => {
                switchMainImage(img);
            });
            
            // Touch event for mobile
            img.addEventListener('touchstart', (e) => {
                e.preventDefault();
                switchMainImage(img);
            }, { passive: false });
        });
        console.log('✅ Thumbnail listeners added');
    }

    // Color selection with auto-collapse
    const colorOptions = document.querySelectorAll('.color-option:not(.disabled)');
    if (colorOptions.length > 0) {
        colorOptions.forEach(opt => {
            // Click event
            opt.addEventListener('click', () => {
                selectColorOption(opt);
            });
            
            // Touch event for mobile
            opt.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectColorOption(opt);
            }, { passive: false });
        });
        console.log('✅ Color option listeners added');
    }

    // Size selection
    const sizeButtons = document.querySelectorAll('.size-button');
    if (sizeButtons.length > 0) {
        sizeButtons.forEach(button => {
            // Click event
            button.addEventListener('click', (e) => {
                e.preventDefault();
                selectSizeOption(button);
            });
            
            // Touch event for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectSizeOption(button);
            }, { passive: false });
        });
        console.log('✅ Size button listeners added');
    }

    // Model selection
    const modelSelector = document.getElementById('model-selector');
    if (modelSelector) {
        modelSelector.addEventListener('change', (e) => {
            console.log('Selected Model:', e.target.value);
        });
        console.log('✅ Model selector listener added');
    }

    // Add to cart - FIXED: Get product info from the current page
    const addToCartBtn = document.getElementById('add-cart');
    if (addToCartBtn && !addToCartBtn.disabled) {
        // Add hover effects for desktop
        addToCartBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.4)';
            }
        });
        
        addToCartBtn.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.3)';
            }
        });

        // Click event
        addToCartBtn.addEventListener('click', handleAddToCart);
        
        // Touch event for mobile
        addToCartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleAddToCart();
        }, { passive: false });
        
        console.log('✅ Add to cart listener added');
    }

    console.log('🎉 All product interactions setup complete');
}

// Helper functions for better organization
function switchMainImage(img) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = img.dataset.src;
    }
    document.querySelectorAll('.product-thumbs img').forEach(i => {
        i.classList.remove('selected');
        i.style.borderColor = 'transparent';
    });
    img.classList.add('selected');
    img.style.borderColor = '#007bff';
}

function selectColorOption(opt) {
    if (opt.classList.contains('disabled')) return;
    
    document.querySelectorAll('.color-option').forEach(o => {
        o.classList.remove('selected');
        o.style.borderColor = '#e5e5e7';
    });
    opt.classList.add('selected');
    opt.style.borderColor = '#007bff';
    
    const mainImage = document.getElementById('main-image');
    if (mainImage && opt.dataset.img) {
        mainImage.src = opt.dataset.img;
    }
    
    // Auto-collapse description when color is selected
    collapseDescriptionOnColorSelect();
}

function selectSizeOption(button) {
    document.querySelectorAll('.size-button').forEach(b => {
        b.classList.remove('selected');
        b.style.background = 'white';
        b.style.color = '#1d1d1f';
        b.style.borderColor = '#e5e5e7';
    });
    button.classList.add('selected');
    button.style.background = '#007bff';
    button.style.color = 'white';
    button.style.borderColor = '#007bff';
    
    const newPrice = Number(button.dataset.price);
    const priceElement = document.getElementById('product-price');
    if (priceElement) {
        priceElement.textContent = `KES ${newPrice.toLocaleString()}`;
    }
}

function handleAddToCart() {
    // Get product info from the current page elements
    const productTitle = document.querySelector('h2') ? document.querySelector('h2').textContent : 'Product';
    const priceElement = document.getElementById('product-price');
    const priceText = priceElement ? priceElement.textContent : 'KES 0';
    const currentPrice = parseFloat(priceText.replace('KES', '').replace(/,/g, '').trim());
    const qtyInput = document.getElementById('qty');
    const initialStock = parseInt(qtyInput.max);
    
    // Get product ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
        showNotification('Error: Could not identify product. Please refresh the page.', 'error');
        return;
    }
    
    // Call the fixed addToCart function
    addToCart(productId, productTitle, currentPrice, initialStock);
}

// Update cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalItems = cart.reduce((total, item) => total + item.qty, 0);
        badge.textContent = totalItems;
    }
});
