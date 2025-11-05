// product-page.js - FOR SINGLE PRODUCT DETAIL PAGE
(async () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const container = document.getElementById('product-page');

    let products = [];
    let product = null;

    // Load product data
    try {
        // Try to load from storefront_products first (admin updates)
        const storefrontProducts = localStorage.getItem('storefront_products');
        
        if (storefrontProducts) {
            products = JSON.parse(storefrontProducts);
            console.log('📦 Loaded products from storefront cache');
        } else {
            // Fallback to original JSON
            const res = await fetch('data/products.json');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            products = await res.json();
            console.log('📦 Loaded products from JSON file');
        }

        product = products.find(x => x.id === id) || products[0];

    } catch (error) {
        console.error("Error loading product data:", error);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 1.2em; margin-bottom: 15px;">❌</div>
                    <div style="margin-bottom: 10px;">Error Loading Product</div>
                    <p>Please check your connection and try again.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                        Try Again
                    </button>
                </div>
            `;
        }
        return;
    }

    if (!product || !container) {
        console.warn("Product or container element not found.");
        return;
    }

    // Calculate available stock
    function getAvailableStock(product, selectedColor = null) {
        if (product.colorStock && Object.keys(product.colorStock).length > 0) {
            return Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0);
        }
        return product.stock || 0;
    }

    let currentPrice = product.sizes && product.sizes.length > 0 ? product.sizes[0].price : product.price;
    let selectedSize = product.sizes && product.sizes.length > 0 ? product.sizes[0].label : null;
    let selectedModel = product.models && product.models.length > 0 ? product.models[0] : null;
    let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0].name : null;

    const hasDiscount = product.originalPrice && product.originalPrice > currentPrice;
    const discountAmount = hasDiscount ? product.originalPrice - currentPrice : 0;
    const saveText = hasDiscount ? `Save ${product.currency} ${discountAmount.toLocaleString()}` : "";

    // Get initial available stock
    const initialStock = getAvailableStock(product, selectedColor);
    
    // Stock status display
    const stockStatus = initialStock > 10 ? 'In Stock' : 
                       initialStock > 0 ? 'Low Stock' : 'Out of Stock';
    const stockClass = initialStock > 10 ? 'in-stock' : 
                      initialStock > 0 ? 'low-stock' : 'out-of-stock';

    // Build product page HTML
    container.innerHTML = `
        <div class="product-page-card">
            <div class="product-slideshow">
                <div class="product-main-image-wrapper">
                    <img id="main-image" src="${product.images[0]}" alt="${product.title}" 
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/400x400?text=No+Image';"/>
                </div>
                <div class="product-thumbs">
                    ${product.images.map((im, idx) => `
                        <img data-src="${im}" ${idx === 0 ? 'class="selected"' : ''} src="${im}" />
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
                    <label>Color:</label>
                    <div class="color-options">
                        ${product.colors.map((c, idx) => {
                            const isAvailable = !product.availableColors || product.availableColors.includes(c.name);
                            const isOutOfStock = initialStock === 0;
                            
                            return `
                            <div class="color-item">
                                <div class="color-name">${c.name} ${isOutOfStock ? '(Out of Stock)' : !isAvailable ? '(Unavailable)' : ''}</div>
                                <div class="color-option ${idx === 0 && isAvailable && !isOutOfStock ? 'selected' : ''} 
                                    ${!isAvailable || isOutOfStock ? 'disabled' : ''}" 
                                    data-img="${c.img}" 
                                    data-name="${c.name}"
                                    ${!isAvailable || isOutOfStock ? 'style="opacity:0.5;cursor:not-allowed;" title="Not available"' : ''}>
                                    <img src="${c.img}" alt="${c.name}">
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                ` : ''}

                ${product.sizes && product.sizes.length > 0 ? `
                <div class="size-options-container">
                    <label>Choose size:</label>
                    <div class="size-buttons" id="size-buttons-group">
                        ${product.sizes.map((s, idx) => `
                            <button class="size-button ${idx === 0 ? 'selected' : ''}"
                                    data-size="${s.label}"
                                    data-price="${s.price}">
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${product.models && product.models.length > 0 ? `
                <div class="model-options-container">
                    <label for="model-selector">Choose Model:</label>
                    <select id="model-selector" class="product-option-select">
                        ${product.models.map((model, idx) => `
                            <option value="${model}" ${idx === 0 ? 'selected' : ''}>
                                ${model}
                            </option>
                        `).join('')}
                    </select>
                </div>` : ''}

                <!-- Quantity input with stock validation -->
                <div class="quantity-container">
                    <label for="qty">Quantity:</label>
                    <input id="qty" type="number" value="1" min="1" max="${initialStock}" 
                           onchange="validateQuantity(this, ${initialStock})" />
                    <div id="quantity-error" class="error-message" style="display: none;"></div>
                </div>

                <button id="add-cart" class="primary" ${initialStock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                    ${initialStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                ${initialStock === 0 ? `
                    <div class="out-of-stock-message">
                        🔔 This item is currently out of stock. Check back later!
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Setup product interactions
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
        addToCartBtn.disabled = false;
        return;
    }
    
    if (quantity > maxStock) {
        errorElement.textContent = `Only ${maxStock} units available. You cannot order more than available stock.`;
        errorElement.style.display = 'block';
        input.value = maxStock;
        addToCartBtn.disabled = false;
    } else {
        errorElement.style.display = 'none';
        addToCartBtn.disabled = false;
    }
}

function setupProductInteractions() {
    // Thumbnail switching
    document.querySelectorAll('.product-thumbs img').forEach(img => {
        img.addEventListener('click', () => {
            document.getElementById('main-image').src = img.dataset.src;
            document.querySelectorAll('.product-thumbs img').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        });
    });

    // Color selection
    document.querySelectorAll('.color-option:not(.disabled)').forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.classList.contains('disabled')) return;
            
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('main-image').src = opt.dataset.img;
        });
    });

    // Size selection
    const sizeButtons = document.querySelectorAll('.size-button');
    if (sizeButtons.length > 0) {
        sizeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                sizeButtons.forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');
                
                const selectedSize = button.dataset.size;
                const currentPrice = Number(button.dataset.price);
                document.getElementById('product-price').textContent = `KES ${currentPrice.toLocaleString()}`;
            });
        });
    }

    // Model selection
    const modelSelector = document.getElementById('model-selector');
    if (modelSelector) {
        modelSelector.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            console.log('Selected Model:', selectedModel);
        });
    }

    // Add to cart
    document.getElementById('add-cart').addEventListener('click', () => {
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

        // Check if item already in cart
        const existingItemIndex = cart.findIndex(item => 
            item.id === product.id && 
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
                id: product.id,
                title: product.title,
                price: currentPrice,
                currency: 'KES',
                qty: quantity,
                color: color,
                size: size,
                model: model,
                img: product.images[0]
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
}
