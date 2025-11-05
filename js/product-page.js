// product-page.js - FOR SINGLE PRODUCT DETAIL PAGE (FIXED FOR DESKTOP)
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
                throw new Error(`HTTP error! status: ${res.status}`);
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
                    <div style="font-size: 1.2em; margin-bottom: 15px;">❌</div>
                    <div style="margin-bottom: 10px; font-weight: bold;">Error Loading Product</div>
                    <p style="margin-bottom: 20px;">${error.message || 'Please check your connection and try again.'}</p>
                    <button onclick="location.reload()" 
                            style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        🔄 Try Again
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

    // Stock status display
    const stockStatus = initialStock > 10 ? 'In Stock' : 
                       initialStock > 0 ? 'Low Stock' : 'Out of Stock';
    const stockClass = initialStock > 10 ? 'in-stock' : 
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
                <h2>${product.title}</h2>

                <!-- Stock status display -->
                <div class="stock-status ${stockClass}">
                    <span class="stock-indicator"></span>
                    ${stockStatus} • ${initialStock} units available
                </div>

                <div class="price-section">
                    <span id="product-price" class="current-price">${product.currency} ${currentPrice.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="old-price">${product.currency} ${product.originalPrice.toLocaleString()}</span>` : ""}
                    ${hasDiscount ? `<span class="discount-tag">${saveText}</span>` : ""}
                </div>

                <div id="product-description-container" class="long-description">
                    <p>${product.description}</p>
                </div>

                ${product.colors && product.colors.length > 0 ? `
                <div id="color-selector">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">Color:</label>
                    <div class="color-options" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${product.colors.map((c, idx) => {
                            const isAvailable = !product.availableColors || product.availableColors.includes(c.name);
                            const isOutOfStock = initialStock === 0;
                            
                            return `
                            <div class="color-item" style="text-align: center;">
                                <div class="color-name" style="font-size: 0.9em; margin-bottom: 5px;">${c.name} ${isOutOfStock ? '(Out of Stock)' : !isAvailable ? '(Unavailable)' : ''}</div>
                                <div class="color-option ${idx === 0 && isAvailable && !isOutOfStock ? 'selected' : ''} 
                                    ${!isAvailable || isOutOfStock ? 'disabled' : ''}" 
                                    data-img="${c.img}" 
                                    data-name="${c.name}"
                                    style="width: 60px; height: 60px; border: 2px solid ${idx === 0 && isAvailable && !isOutOfStock ? '#007bff' : '#ddd'}; border-radius: 8px; padding: 2px; cursor: ${!isAvailable || isOutOfStock ? 'not-allowed' : 'pointer'}; opacity: ${!isAvailable || isOutOfStock ? '0.5' : '1'};">
                                    <img src="${c.img}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                ` : ''}

                ${product.sizes && product.sizes.length > 0 ? `
                <div class="size-options-container" style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">Choose size:</label>
                    <div class="size-buttons" id="size-buttons-group" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${product.sizes.map((s, idx) => `
                            <button class="size-button ${idx === 0 ? 'selected' : ''}"
                                    data-size="${s.label}"
                                    data-price="${s.price}"
                                    style="padding: 10px 15px; border: 2px solid ${idx === 0 ? '#007bff' : '#ddd'}; background: ${idx === 0 ? '#007bff' : 'white'}; color: ${idx === 0 ? 'white' : '#333'}; border-radius: 6px; cursor: pointer;">
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${product.models && product.models.length > 0 ? `
                <div class="model-options-container" style="margin: 20px 0;">
                    <label for="model-selector" style="display: block; margin-bottom: 10px; font-weight: bold;">Choose Model:</label>
                    <select id="model-selector" class="product-option-select" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; width: 100%; max-width: 300px;">
                        ${product.models.map((model, idx) => `
                            <option value="${model}" ${idx === 0 ? 'selected' : ''}>
                                ${model}
                            </option>
                        `).join('')}
                    </select>
                </div>` : ''}

                <!-- Quantity input with stock validation -->
                <div class="quantity-container" style="margin: 20px 0;">
                    <label for="qty" style="display: block; margin-bottom: 10px; font-weight: bold;">Quantity:</label>
                    <input id="qty" type="number" value="1" min="1" max="${initialStock}" 
                           style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; width: 80px; text-align: center;"
                           onchange="validateQuantity(this, ${initialStock})" />
                    <div id="quantity-error" class="error-message" style="display: none;"></div>
                </div>

                <button id="add-cart" class="primary" ${initialStock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                        style="padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 1.1em; cursor: pointer; width: 100%; max-width: 300px;">
                    ${initialStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                ${initialStock === 0 ? `
                    <div class="out-of-stock-message" style="margin-top: 15px;">
                        🔔 This item is currently out of stock. Check back later!
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

function setupProductInteractions() {
    console.log('🔄 Setting up product interactions...');
    
    // Thumbnail switching
    const thumbnails = document.querySelectorAll('.product-thumbs img');
    if (thumbnails.length > 0) {
        thumbnails.forEach(img => {
            img.addEventListener('click', () => {
                const mainImage = document.getElementById('main-image');
                if (mainImage) {
                    mainImage.src = img.dataset.src;
                }
                thumbnails.forEach(i => i.classList.remove('selected'));
                img.classList.add('selected');
                img.style.borderColor = '#007bff';
            });
        });
        console.log('✅ Thumbnail listeners added');
    }

    // Color selection
    const colorOptions = document.querySelectorAll('.color-option:not(.disabled)');
    if (colorOptions.length > 0) {
        colorOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                if (opt.classList.contains('disabled')) return;
                
                colorOptions.forEach(o => {
                    o.classList.remove('selected');
                    o.style.borderColor = '#ddd';
                });
                opt.classList.add('selected');
                opt.style.borderColor = '#007bff';
                
                const mainImage = document.getElementById('main-image');
                if (mainImage && opt.dataset.img) {
                    mainImage.src = opt.dataset.img;
                }
            });
        });
        console.log('✅ Color option listeners added');
    }

    // Size selection
    const sizeButtons = document.querySelectorAll('.size-button');
    if (sizeButtons.length > 0) {
        sizeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                sizeButtons.forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = 'white';
                    b.style.color = '#333';
                    b.style.borderColor = '#ddd';
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
            });
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

    // Add to cart
    const addToCartBtn = document.getElementById('add-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const qtyInput = document.getElementById('qty');
            const quantity = parseInt(qtyInput.value);
            const maxStock = parseInt(qtyInput.max);
            
            // Final validation
            if (quantity > maxStock) {
                alert(`❌ Cannot add to cart! Only ${maxStock} units available.`);
                qtyInput.value = maxStock;
                return;
            }
            
            if (quantity < 1) {
                alert('❌ Please enter a valid quantity.');
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
                item.id === id && 
                item.color === color && 
                item.size === size &&
                item.model === model
            );

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                const newQty = cart[existingItemIndex].qty + quantity;
                if (newQty > maxStock) {
                    alert(`❌ Cannot add more! You already have ${cart[existingItemIndex].qty} in cart, only ${maxStock} available total.`);
                    return;
                }
                cart[existingItemIndex].qty = newQty;
            } else {
                // Add new item
                cart.push({
                    id: id,
                    title: document.querySelector('h2') ? document.querySelector('h2').textContent : 'Product',
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
            alert(`✅ Added ${quantity} item(s) to cart!`);

            // Update cart count
            const badge = document.getElementById('cart-count');
            if (badge) {
                const totalItems = cart.reduce((total, item) => total + item.qty, 0);
                badge.textContent = totalItems;
            }
        });
        console.log('✅ Add to cart listener added');
    }

    console.log('🎉 All product interactions setup complete');
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
