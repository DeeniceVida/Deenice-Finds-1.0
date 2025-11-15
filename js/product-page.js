// product-page.js - FOR SINGLE PRODUCT DETAIL PAGE (KENYA SEO ENHANCED - CLEAN)
(async () => {
    // 1. Initial Setup and Parameter Retrieval
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const container = document.getElementById('product-page');

    console.log('Loading product page for ID:', id);

    let products = [];
    let product = null;

    // 2. Fetch Data with Enhanced Error Handling
    try {
        // ✅ ADDED: Cache validation and clearing
        const cacheVersion = localStorage.getItem('cache_version');
        const currentVersion = '2.1'; // 🔥 UPDATED to match config.js
        
        // Clear cache if version mismatch or has old product IDs
        if (cacheVersion !== currentVersion) {
            console.log('🔄 Cache version mismatch, clearing...');
            localStorage.removeItem('storefront_products');
            localStorage.removeItem('inventory_products');
        }
        
        // Try to load from storefront_products first (admin updates)
        const storefrontProducts = localStorage.getItem('storefront_products');
        
        if (storefrontProducts && cacheVersion === currentVersion) {
            products = JSON.parse(storefrontProducts);
            console.log('Loaded products from storefront cache:', products.length);
            
            // Validate cache has new product structure
            const sampleProduct = products.find(p => p.id === 'selfie-monitor-screen');
            if (!sampleProduct) {
                console.log('🔄 Cache has old product structure, loading fresh...');
                localStorage.removeItem('storefront_products');
                throw new Error('Cache outdated, loading fresh data');
            }
        } else {
            // Fallback to original JSON file
            console.log('No valid storefront cache, loading from JSON...');
            const res = await fetch('data/products.json?v=' + Date.now()); // Cache bust
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            products = await res.json();
            console.log('Loaded products from JSON file:', products.length);
            
            // Save to cache
            localStorage.setItem('storefront_products', JSON.stringify(products));
        }

        // ✅ FIXED: Find the product by ID - NO FALLBACK to first product
        product = products.find(x => x.id === id);
        
        if (!product) {
            const availableIds = products.map(p => p.id).join(', ');
            throw new Error(`Product with ID "${id}" not found. Available products: ${availableIds}`);
        }

        console.log('Found product:', product.title);

    } catch (error) {
        console.error("Error loading product data:", error);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="margin-bottom: 15px; font-size: 3em;">❌</div>
                    <div style="margin-bottom: 10px; font-weight: bold;">Product Not Found</div>
                    <p style="margin-bottom: 20px;">${error.message || 'The product you\'re looking for is not available.'}</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.href='products.html'" 
                                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Browse All Products
                        </button>
                        <button onclick="clearProductCacheAndReload()" 
                                style="padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Clear Cache & Retry
                        </button>
                        <button onclick="location.reload()" 
                                style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }
        return;
    }

    // Stop if no product or container found
    if (!product || !container) {
        console.error("Product or container element not found.");
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

    // Check if product is thermal printer for special handling
    const isThermalPrinter = product.title.toLowerCase().includes('thermal') || 
                            product.category && product.category.toLowerCase().includes('thermal') ||
                            product.tags && product.tags.some(tag => tag.toLowerCase().includes('thermal'));

    // Clean stock status display
    let stockStatus, stockClass;
    if (isThermalPrinter) {
        stockStatus = 'Available on Order';
        stockClass = 'special-order';
    } else {
        stockStatus = initialStock > 5 ? 'In Stock' : 
                     initialStock > 0 ? 'Low Stock' : 'Out of Stock';
        stockClass = initialStock > 5 ? 'in-stock' : 
                    initialStock > 0 ? 'low-stock' : 'out-of-stock';
    }

    // Update page title and meta for SEO
    document.title = `${product.title} - Buy in Kenya | Deenice Finds`;
    
    // Update meta description dynamically
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        if (isThermalPrinter) {
            metaDescription.content = `Order ${product.title} in Kenya. Importing duration 5-7 days. Best price KES ${currentPrice.toLocaleString()}. Delivery Nairobi, Mombasa, Kisumu. M-Pesa accepted.`;
        } else {
            metaDescription.content = `Buy ${product.title} in Kenya. Best price KES ${currentPrice.toLocaleString()}. Delivery Nairobi, Mombasa, Kisumu. M-Pesa accepted.`;
        }
    }

    // 4. Build Product Page HTML with Kenya SEO enhancements
    container.innerHTML = `
        <div class="product-page-card">
            <div class="product-slideshow">
                <div class="product-main-image-wrapper">
                    <img id="main-image" src="${product.images[0]}" alt="${product.title} - Buy in Kenya" 
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/400x400?text=No+Image';"/>
                </div>
                
                <!-- Enhanced Thumbnails with Slider -->
                <div class="product-thumbs-container">
                    <div class="product-thumbs" id="product-thumbs">
                        ${product.images.map((im, idx) => `
                            <img data-src="${im}" ${idx === 0 ? 'class="thumb-image selected"' : 'class="thumb-image"'} src="${im}" 
                                 alt="${product.title} - Image ${idx + 1}"
                                 onclick="switchMainImage(this)" />
                        `).join('')}
                    </div>
                    
                    <!-- Navigation arrows for many thumbnails -->
                    ${product.images.length > 4 ? `
                        <button class="thumb-nav thumb-prev" aria-label="Previous thumbnails">‹</button>
                        <button class="thumb-nav thumb-next" aria-label="Next thumbnails">›</button>
                    ` : ''}
                </div>
            </div>

            <div id="product-details">
                <h1 style="font-weight: 600; color: #1d1d1f; margin-bottom: 15px; font-size: 1.8em;">${product.title}</h1>

                <!-- Kenya Delivery Badge -->
                <div style="background: #e3f2fd; color: #1976d2; padding: 8px 15px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 15px; font-size: 0.9em; font-weight: 500;">
                    <span>Available in Kenya</span>
                </div>

                <!-- Special Stock status for Thermal Printers -->
                ${isThermalPrinter ? `
                <div class="stock-status special-order" style="font-weight: 500; padding: 12px; border-radius: 8px; margin: 15px 0; background: #fff3cd; border: 1px solid #ffeaa7; color: #856404;">
                    <strong>Available on Order</strong>
                    <div style="font-size: 0.9em; margin-top: 5px; font-weight: normal;">
                        Importing duration: 5-7 days
                    </div>
                </div>
                ` : `
                <!-- Regular Stock status display -->
                <div class="stock-status ${stockClass}" style="font-weight: 500; padding: 12px; border-radius: 8px; margin: 15px 0; background: ${initialStock > 5 ? '#f0f9f0' : initialStock > 0 ? '#fff8e6' : '#fef0f0'}; border: 1px solid ${initialStock > 5 ? '#d4edda' : initialStock > 0 ? '#ffeaa7' : '#f5c6cb'}; color: ${initialStock > 5 ? '#155724' : initialStock > 0 ? '#856404' : '#721c24'};">
                    <strong>${stockStatus}</strong>
                    ${initialStock > 0 && initialStock <= 5 ? `<div style="font-size: 0.9em; margin-top: 5px; font-weight: normal;">Only ${initialStock} items remaining in Kenya</div>` : ''}
                </div>
                `}

                <div class="price-section" style="margin: 20px 0;">
                    <span id="product-price" class="current-price" style="font-size: 1.4em; font-weight: 700; color: #1d1d1f;">${product.currency} ${currentPrice.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="old-price" style="text-decoration: line-through; color: #86868b; margin-left: 10px;">${product.currency} ${product.originalPrice.toLocaleString()}</span>` : ""}
                    ${hasDiscount ? `<span class="discount-tag" style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; margin-left: 10px; font-weight: 500;">${saveText}</span>` : ""}
                </div>

                <!-- Kenya Shipping Info -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <strong style="color: #333;">Kenya Delivery Information</strong>
                    </div>
                    <div style="font-size: 0.9em; color: #666;">
                        ${isThermalPrinter ? `
                        <div>• <strong>Special Order:</strong> Importing duration 5-7 days</div>
                        <div>• <strong>Nationwide:</strong> Delivery after import clearance</div>
                        ` : `
                        <div>• <strong>Nairobi:</strong> Delivery available</div>
                        <div>• <strong>Major Cities:</strong> 1-2 business days</div>
                        <div>• <strong>Nationwide:</strong> 2-5 business days</div>
                        `}
                        <div>• <strong>Payment:</strong> M-Pesa, Bank Transfer</div>
                    </div>
                </div>

                <!-- Description with collapse feature -->
                <div id="product-description-container" class="description-container">
                    <div class="description-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 15px 0; border-bottom: 1px solid #e5e5e7;">
                        <h3 style="margin: 0; font-size: 1.1em; font-weight: 600; color: #1d1d1f;">Product Description</h3>
                        <span id="description-toggle" style="font-size: 1.2em; color: #86868b;">−</span>
                    </div>
                    <div id="description-content" class="description-content" style="padding: 15px 0; max-height: 200px; overflow: hidden; transition: max-height 0.3s ease;">
                        <p style="margin: 0; line-height: 1.6; color: #515154;">${product.description}</p>
                        <!-- Kenya-specific content -->
                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <strong>Available in Kenya:</strong> ${isThermalPrinter ? 'This product is available for special order with 5-7 days importing duration.' : 'This product is available for delivery across Kenya.'}
                        </div>
                    </div>
                </div>

                ${product.colors && product.colors.length > 0 ? `
                <div id="color-selector" style="margin: 25px 0;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #1d1d1f;">Color:</label>
                    <div class="color-options" style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${product.colors.map((c, idx) => {
                            const isAvailable = !product.availableColors || product.availableColors.includes(c.name);
                            const isOutOfStock = initialStock === 0 && !isThermalPrinter;
                            
                            return `
                            <div class="color-item" style="text-align: center;">
                                <div class="color-name" style="font-size: 0.85em; margin-bottom: 6px; color: #515154;">${c.name} ${isOutOfStock ? '(Out of Stock)' : !isAvailable ? '(Unavailable)' : ''}</div>
                                <div class="color-option ${idx === 0 && isAvailable && !isOutOfStock ? 'selected' : ''} 
                                    ${!isAvailable || isOutOfStock ? 'disabled' : ''}" 
                                    data-img="${c.img}" 
                                    data-name="${c.name}"
                                    style="width: 60px; height: 60px; border: 2px solid ${idx === 0 && isAvailable && !isOutOfStock ? '#007bff' : '#e5e5e7'}; border-radius: 10px; padding: 2px; cursor: ${!isAvailable || isOutOfStock ? 'not-allowed' : 'pointer'}; opacity: ${!isAvailable || isOutOfStock ? '0.5' : '1'}; transition: all 0.2s ease;">
                                    <img src="${c.img}" alt="${product.title} - ${c.name} color - Available in Kenya" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
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
                    <input id="qty" type="number" value="1" min="1" ${isThermalPrinter ? '' : `max="${initialStock}"`}
                           style="padding: 12px; border: 1px solid #e5e5e7; border-radius: 8px; width: 100px; text-align: center; font-size: 1em; color: #1d1d1f;"
                           onchange="${isThermalPrinter ? '' : `validateQuantity(this, ${initialStock})`}" />
                    <div id="quantity-error" class="error-message" style="display: none; color: #ff3b30; font-size: 0.9em; margin-top: 5px;"></div>
                </div>

                <!-- Premium Add to Cart Button -->
                <button id="add-cart" class="add-to-cart-btn primary" ${initialStock === 0 && !isThermalPrinter ? 'disabled' : ''}
                        style="padding: 18px 30px; 
                               background: ${(initialStock === 0 && !isThermalPrinter) ? '#8E8E93' : '#007bff'}; 
                               color: white; 
                               border: none; 
                               border-radius: 12px; 
                               font-size: 1.1em; 
                               cursor: ${(initialStock === 0 && !isThermalPrinter) ? 'not-allowed' : 'pointer'}; 
                               width: 100%; 
                               max-width: 350px; 
                               font-weight: 600; 
                               transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                               box-shadow: ${(initialStock === 0 && !isThermalPrinter) ? 'none' : '0 4px 20px rgba(0, 123, 255, 0.3)'};
                               opacity: ${(initialStock === 0 && !isThermalPrinter) ? '0.6' : '1'};">
                    ${isThermalPrinter ? 'Order Now - Importing 5-7 Days' : 
                      initialStock === 0 ? 'Out of Stock' : 'Add to Cart - Buy in Kenya'}
                </button>
                
                <!-- M-Pesa Payment Info -->
                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: #f8f9fa; padding: 8px 15px; border-radius: 20px;">
                        <span>M-Pesa & Bank Transfer Accepted</span>
                    </div>
                </div>
                
                ${isThermalPrinter ? `
                    <div class="special-order-notice" style="margin-top: 15px; text-align: center; color: #856404; font-size: 0.9em; font-style: italic;">
                        Special Order Item: This thermal printer requires 5-7 days importing duration. We'll contact you after order confirmation.
                    </div>
                ` : initialStock > 0 && initialStock <= 5 ? `
                    <div class="stock-notice" style="margin-top: 15px; text-align: center; color: #856404; font-size: 0.9em; font-style: italic;">
                        Limited availability in Kenya. Recommended to complete your purchase soon.
                    </div>
                ` : ''}
                
                ${initialStock === 0 && !isThermalPrinter ? `
                    <div class="out-of-stock-message" style="margin-top: 15px; text-align: center; color: #721c24; font-size: 0.9em;">
                        This item is currently out of stock in Kenya. Please check back later or contact us for restock updates.
                    </div>
                ` : ''}

                <!-- Kenya Trust Badges -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2em; color: #007bff; margin-bottom: 5px;">●</div>
                        <div style="font-size: 0.8em; font-weight: 600;">Kenyan Business</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2em; color: #007bff; margin-bottom: 5px;">●</div>
                        <div style="font-size: 0.8em; font-weight: 600;">Nationwide Delivery</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2em; color: #007bff; margin-bottom: 5px;">●</div>
                        <div style="font-size: 0.8em; font-weight: 600;">M-Pesa Pay</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.2em; color: #007bff; margin-bottom: 5px;">●</div>
                        <div style="font-size: 0.8em; font-weight: 600;">Quality Tested</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hidden SEO Content for Kenya -->
        <div style="display: none;" aria-hidden="true">
            <h2>${isThermalPrinter ? 'Order' : 'Buy'} ${product.title} in Kenya</h2>
            <p>${isThermalPrinter ? 'Order' : 'Purchase'} ${product.title} from Deenice Finds Kenya. ${isThermalPrinter ? 'Special order with 5-7 days importing duration.' : 'Best prices in Nairobi, Mombasa, Kisumu with nationwide delivery.'} Available for M-Pesa payment across Kenya.</p>
            <p>Tech products Kenya, phones Kenya, earbuds Nairobi, mobile accessories Kenya${isThermalPrinter ? ', thermal printers Kenya' : ''}.</p>
        </div>
    `;

    console.log('Product page rendered successfully');

    // 5. Add Enhanced Structured Data for Kenya SEO
    addProductStructuredData(product, selectedColor, selectedSize, selectedModel, currentPrice, initialStock, isThermalPrinter);

    // 6. Setup Event Listeners
    setupProductInteractions(isThermalPrinter);
})();

// Enhanced thumbnail switching with slider support - FIXED FUNCTION
function switchMainImage(img) {
    console.log('Switching to image:', img.src);
    
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = img.dataset.src || img.src;
        // Update alt text for SEO
        mainImage.alt = `${document.querySelector('h1').textContent} - ${img.alt}`;
    }
    
    // Update selected thumbnail - FIXED SELECTION
    document.querySelectorAll('.thumb-image').forEach(i => {
        i.classList.remove('selected');
    });
    img.classList.add('selected');
    
    // Add visual feedback
    img.style.border = '2px solid #007bff';
    img.style.opacity = '1';
    
    // Scroll thumbnail into view if needed
    if (img.parentElement.scrollWidth > img.parentElement.clientWidth) {
        img.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

// Setup thumbnail slider navigation - FIXED FUNCTION
function setupThumbnailSlider() {
    const thumbsContainer = document.querySelector('.product-thumbs');
    const prevBtn = document.querySelector('.thumb-prev');
    const nextBtn = document.querySelector('.thumb-next');
    
    if (!thumbsContainer) return;
    
    // Only setup navigation if there are many thumbnails
    if (prevBtn && nextBtn) {
        const scrollAmount = 200;
        
        prevBtn.addEventListener('click', () => {
            thumbsContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', () => {
            thumbsContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Show/hide arrows based on scroll position
        const updateNavButtons = () => {
            const scrollLeft = thumbsContainer.scrollLeft;
            const scrollWidth = thumbsContainer.scrollWidth;
            const clientWidth = thumbsContainer.clientWidth;
            
            prevBtn.style.opacity = scrollLeft > 0 ? '1' : '0.5';
            prevBtn.disabled = scrollLeft <= 0;
            nextBtn.style.opacity = scrollLeft < (scrollWidth - clientWidth - 10) ? '1' : '0.5';
            nextBtn.disabled = scrollLeft >= (scrollWidth - clientWidth - 10);
        };
        
        thumbsContainer.addEventListener('scroll', updateNavButtons);
        updateNavButtons(); // Initial check
    }
    
    // Add click events to all thumbnails - FIXED EVENT LISTENERS
    const thumbnails = document.querySelectorAll('.thumb-image');
    console.log('Found thumbnails:', thumbnails.length);
    
    thumbnails.forEach((img, index) => {
        // Remove any existing event listeners first
        img.replaceWith(img.cloneNode(true));
    });
    
    // Re-select thumbnails after cloning
    const refreshedThumbnails = document.querySelectorAll('.thumb-image');
    
    refreshedThumbnails.forEach((img, index) => {
        // Click event
        img.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Thumbnail clicked:', index, this.src);
            switchMainImage(this);
        });
        
        // Touch event for mobile
        img.addEventListener('touchstart', function(e) {
            e.preventDefault();
            console.log('Thumbnail touched:', index, this.src);
            switchMainImage(this);
        }, { passive: false });
        
        // Keyboard navigation
        img.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('Thumbnail keyboard activated:', index, this.src);
                switchMainImage(this);
            }
        });
        
        // Make thumbnails focusable for accessibility
        img.setAttribute('tabindex', '0');
        img.style.cursor = 'pointer';
        img.style.transition = 'all 0.2s ease';
        
        // Add hover effects
        img.addEventListener('mouseenter', function() {
            if (!this.classList.contains('selected')) {
                this.style.opacity = '0.8';
                this.style.transform = 'scale(1.05)';
            }
        });
        
        img.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            }
        });
        
        // Set initial selected state
        if (index === 0) {
            img.classList.add('selected');
            img.style.border = '2px solid #007bff';
        } else {
            img.style.border = '2px solid transparent';
        }
    });
    
    console.log('Thumbnail event listeners setup complete');
}

// Cache clearing function for product page
function clearProductCacheAndReload() {
    localStorage.removeItem('storefront_products');
    localStorage.removeItem('inventory_products');
    localStorage.removeItem('storefront_products_updated');
    alert('Cache cleared! Reloading...');
    setTimeout(() => location.reload(), 1000);
}

// Enhanced Product Structured Data Function for Kenya SEO
function addProductStructuredData(product, selectedColor, selectedSize, selectedModel, currentPrice, initialStock, isThermalPrinter) {
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "description": product.description,
        "image": product.images,
        "sku": product.id,
        "mpn": product.id,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Deenice Finds"
        },
        "offers": {
            "@type": "Offer",
            "price": currentPrice,
            "priceCurrency": "KES",
            "priceValidUntil": "2024-12-31",
            "availability": isThermalPrinter ? "https://schema.org/PreOrder" : (initialStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"),
            "url": window.location.href,
            "seller": {
                "@type": "Organization",
                "name": "Deenice Finds",
                "url": "https://www.deenice.store"
            },
            "areaServed": "KE",
            "availableDeliveryMethod": "https://schema.org/ParcelService",
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 7,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating || 4.5,
            "reviewCount": product.reviewCount || 15,
            "bestRating": "5",
            "worstRating": "1"
        }
    };

    // Add delivery lead time for thermal printers
    if (isThermalPrinter) {
        productSchema.offers.deliveryLeadTime = "P5D";
    }

    // Add color variant if available
    if (selectedColor) {
        productSchema.color = selectedColor;
    }

    // Add size variant if available
    if (selectedSize && selectedSize !== 'Standard') {
        productSchema.additionalProperty = [{
            "@type": "PropertyValue",
            "name": "size",
            "value": selectedSize
        }];
    }

    // Add model variant if available
    if (selectedModel && selectedModel !== 'Standard') {
        if (!productSchema.additionalProperty) {
            productSchema.additionalProperty = [];
        }
        productSchema.additionalProperty.push({
            "@type": "PropertyValue",
            "name": "model",
            "value": selectedModel
        });
    }

    // Remove existing product schema
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-product-schema]');
    if (existingSchema) {
        existingSchema.remove();
    }

    // Add new product schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-schema', 'true');
    script.text = JSON.stringify(productSchema);
    document.head.appendChild(script);
    
    console.log('Enhanced Kenya product structured data added');
}

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
        errorElement.textContent = `Only ${maxStock} units available in Kenya. You cannot order more than available stock.`;
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

// Add to cart function (Updated for thermal printers)
function addToCart(productId, productTitle, currentPrice, initialStock, isThermalPrinter) {
    const qtyInput = document.getElementById('qty');
    const quantity = parseInt(qtyInput.value);
    
    // Skip stock validation for thermal printers
    if (!isThermalPrinter) {
        const maxStock = parseInt(qtyInput.max);
        
        // Final validation
        if (quantity > maxStock) {
            showNotification(`Cannot add to cart! Only ${maxStock} units available in Kenya.`, 'error');
            qtyInput.value = maxStock;
            return;
        }
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
        if (!isThermalPrinter && newQty > initialStock) {
            showNotification(`Cannot add more! You already have ${cart[existingItemIndex].qty} in cart, only ${initialStock} available total in Kenya.`, 'error');
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
            img: document.getElementById('main-image') ? document.getElementById('main-image').src : '',
            isSpecialOrder: isThermalPrinter || false
        });
    }

    localStorage.setItem('de_cart', JSON.stringify(cart));
    
    if (isThermalPrinter) {
        showNotification(`Order placed for ${quantity} thermal printer${quantity > 1 ? 's' : ''}! We'll contact you about the 5-7 days importing process.`, 'success');
    } else {
        showNotification(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart - Ready for Kenya delivery`, 'success');
    }

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

function setupProductInteractions(isThermalPrinter) {
    console.log('Setting up product interactions...');
    
    // Description toggle
    const descriptionHeader = document.querySelector('.description-header');
    if (descriptionHeader) {
        descriptionHeader.addEventListener('click', toggleDescription);
        descriptionHeader.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleDescription();
        }, { passive: false });
        console.log('Description toggle listener added');
    }

    // Enhanced thumbnail switching with slider - CALL THIS FIRST
    setupThumbnailSlider();
    console.log('Thumbnail slider listeners added');

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
        console.log('Color option listeners added');
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
        console.log('Size button listeners added');
    }

    // Model selection
    const modelSelector = document.getElementById('model-selector');
    if (modelSelector) {
        modelSelector.addEventListener('change', (e) => {
            console.log('Selected Model:', e.target.value);
            // Update structured data when model changes
            updateStructuredDataOnChange();
        });
        console.log('Model selector listener added');
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
        addToCartBtn.addEventListener('click', function() {
            handleAddToCart(isThermalPrinter);
        });
        
        // Touch event for mobile
        addToCartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleAddToCart(isThermalPrinter);
        }, { passive: false });
        
        console.log('Add to cart listener added');
    }

    console.log('All product interactions setup complete');
}

// Helper functions for better organization
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
        // Update alt text for SEO
        mainImage.alt = `${document.querySelector('h1').textContent} - ${opt.dataset.name} color - Available in Kenya`;
    }
    
    // Auto-collapse description when color is selected
    collapseDescriptionOnColorSelect();
    
    // Update structured data
    updateStructuredDataOnChange();
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
    
    // Update structured data
    updateStructuredDataOnChange();
}

function handleAddToCart(isThermalPrinter) {
    // Get product info from the current page elements
    const productTitle = document.querySelector('h1') ? document.querySelector('h1').textContent : 'Product';
    const priceElement = document.getElementById('product-price');
    const priceText = priceElement ? priceElement.textContent : 'KES 0';
    const currentPrice = parseFloat(priceText.replace('KES', '').replace(/,/g, '').trim());
    const qtyInput = document.getElementById('qty');
    const initialStock = qtyInput ? parseInt(qtyInput.max) : 0;
    
    // Get product ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
        showNotification('Error: Could not identify product. Please refresh the page.', 'error');
        return;
    }
    
    // Call the fixed addToCart function
    addToCart(productId, productTitle, currentPrice, initialStock, isThermalPrinter);
}

// Update structured data when product options change
function updateStructuredDataOnChange() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = JSON.parse(localStorage.getItem('storefront_products') || '[]').find(p => p.id === id);
    
    if (product) {
        const selectedColorEl = document.querySelector('.color-option.selected');
        const selectedColor = selectedColorEl ? selectedColorEl.dataset.name : null;
        
        const selectedSizeEl = document.querySelector('.size-button.selected');
        const selectedSize = selectedSizeEl ? selectedSizeEl.dataset.size : null;
        
        const modelSelector = document.getElementById('model-selector');
        const selectedModel = modelSelector ? modelSelector.value : null;
        
        const priceElement = document.getElementById('product-price');
        const priceText = priceElement ? priceElement.textContent : 'KES 0';
        const currentPrice = parseFloat(priceText.replace('KES', '').replace(/,/g, '').trim());
        
        const qtyInput = document.getElementById('qty');
        const initialStock = qtyInput ? parseInt(qtyInput.max) : 0;
        
        const isThermalPrinter = product.title.toLowerCase().includes('thermal') || 
                                product.category && product.category.toLowerCase().includes('thermal') ||
                                product.tags && product.tags.some(tag => tag.toLowerCase().includes('thermal'));
        
        addProductStructuredData(product, selectedColor, selectedSize, selectedModel, currentPrice, initialStock, isThermalPrinter);
    }
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
