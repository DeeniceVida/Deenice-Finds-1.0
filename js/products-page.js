// products-page.js - FOR PRODUCTS LISTING PAGE (KENYA SEO ENHANCED)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products page initialized');
    await initializeProductsPage();
});

async function initializeProductsPage() {
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }

    // Show proper loading state
    grid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div class="loading-spinner"></div>
            <div style="margin-bottom: 10px;">Loading Products in Kenya...</div>
            <small>Please wait while we load the latest inventory for Kenyan customers</small>
        </div>
    `;

    try {
        await loadAndRenderProducts();
        updateCartCount();
        addCacheClearButton(); // Add cache clear button
        console.log('✅ Products loaded successfully for Kenya');

    } catch (error) {
        console.error('❌ Error loading products:', error);
        showErrorState(error);
    }
}

// Cache clearing button for users
function addCacheClearButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('cache-clear-btn');
    if (existingBtn) existingBtn.remove();

    const clearBtn = document.createElement('button');
    clearBtn.id = 'cache-clear-btn';
    clearBtn.innerHTML = '🔄 Clear Cache';
    clearBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999;
        background: #ff6b35;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    clearBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });
    
    clearBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    clearBtn.addEventListener('click', function() {
        if (confirm('Clear product cache and reload? This will fix missing products.')) {
            localStorage.removeItem('storefront_products');
            localStorage.removeItem('inventory_products');
            localStorage.removeItem('storefront_products_updated');
            alert('Cache cleared! Reloading...');
            setTimeout(() => location.reload(), 1000);
        }
    });
    
    document.body.appendChild(clearBtn);
}

// SINGLE loadAndRenderProducts function with category support
async function loadAndRenderProducts() {
    const grid = document.getElementById('products-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    
    console.log('📱 Loading products for category:', category || 'all');

    // Load products
    let products = await loadProductsUniversal();
    
    if (category && category !== 'all') {
        products = filterProductsByCategory(products, category);
    }
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 1.2em; margin-bottom: 15px;">📦</div>
                <div style="margin-bottom: 10px;">
                    ${category ? `No products found in "${category}" category` : 'No Products Available in Kenya'}
                </div>
                <small>${category ? 'Try browsing all products or check back later.' : 'Check back later for new arrivals in Kenya'}</small>
                ${category ? `
                    <div style="margin-top: 15px;">
                        <button onclick="window.location.href='products.html'" 
                                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            View All Products Kenya
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        return;
    }

    renderProductsGrid(products);
    
    // Update page title and heading with category for Kenya SEO
    updatePageMetadata(category, products);
    
    console.log('✅ Rendered', products.length, 'products for category:', category || 'all');
}

function updatePageMetadata(category, products) {
    if (category && category !== 'all') {
        const categories = window.categoriesManager ? categoriesManager.getCategories() : [];
        const currentCategory = categories.find(cat => cat.id === category);
        
        if (currentCategory) {
            document.title = `${currentCategory.name} — Buy in Kenya | Deenice Finds`;
            
            // Update the page heading
            const pageHeading = document.querySelector('h1');
            if (pageHeading) {
                pageHeading.textContent = `${currentCategory.name} in Kenya`;
            }
            
            // Update meta description for Kenya SEO
            updateMetaDescription(`Buy ${currentCategory.name} in Kenya. Best prices in Nairobi, Mombasa, Kisumu. Delivery nationwide. M-Pesa accepted.`);
        } else {
            // Fallback for unknown categories
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            document.title = `${formattedCategory} — Buy in Kenya | Deenice Finds`;
            
            const pageHeading = document.querySelector('h1');
            if (pageHeading) {
                pageHeading.textContent = `${formattedCategory} in Kenya`;
            }
        }
    } else {
        // Update for all products page
        document.title = 'All Products — Buy Tech in Kenya | Deenice Finds';
        updateMetaDescription('Shop all tech products in Kenya. Phones, earbuds, accessories with delivery nationwide. Best prices in Nairobi, Mombasa, Kisumu. M-Pesa accepted.');
    }
}

function updateMetaDescription(description) {
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
}

// Product loading logic - UPDATED WITH BETTER CACHE VALIDATION
async function loadProductsUniversal() {
    let products = [];
    
    // STRATEGY 1: Try storefront_products (admin updates) - WITH IMPROVED CACHE CHECK
    try {
        const storefrontProducts = localStorage.getItem('storefront_products');
        const cacheVersion = localStorage.getItem('cache_version');
        const currentVersion = '2.1'; // 🔥 UPDATED to match config.js
        
        // Only use cache if version matches AND cache is not too old
        if (storefrontProducts && cacheVersion === currentVersion) {
            const cacheTime = localStorage.getItem('storefront_products_updated');
            const cacheAge = cacheTime ? Date.now() - new Date(cacheTime).getTime() : Infinity;
            const maxCacheAge = 30 * 60 * 1000; // 30 minutes max cache age
            
            if (cacheAge < maxCacheAge) {
                products = JSON.parse(storefrontProducts);
                console.log('✅ Loaded from storefront cache:', products.length, 'products');
                
                // Validate cache has the expected product structure
                const expectedProductIds = ['selfie-monitor-screen', 'pegboard-organizer', 'car-phone-mount'];
                const hasExpectedProducts = expectedProductIds.every(id => 
                    products.some(p => p && p.id === id)
                );
                
                if (hasExpectedProducts) {
                    return products.filter(p => p && p.id);
                } else {
                    console.log('🔄 Cache missing expected products, refreshing...');
                    localStorage.removeItem('storefront_products');
                }
            } else {
                console.log('🔄 Cache expired, refreshing...');
                localStorage.removeItem('storefront_products');
            }
        }
    } catch (e) {
        console.log('❌ Storefront cache error, trying next source...');
    }
    
    // STRATEGY 2: Load from JSON file (fresh data) - WITH AGGRESSIVE CACHE BUSTING
    console.log('📦 Loading fresh from JSON file...');
    try {
        // 🔥 AGGRESSIVE cache busting
        const cacheBuster = 'v=' + Date.now() + Math.random();
        const response = await fetch(`data/products.json?${cacheBuster}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        products = await response.json();
        
        // Validate products data structure
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data format - expected array');
        }
        
        if (products.length === 0) {
            throw new Error('No products found in JSON file');
        }
        
        // Validate we have the expected product IDs from your JSON
        const expectedProductIds = ['selfie-monitor-screen', 'pegboard-organizer', 'car-phone-mount'];
        const foundProductIds = products.map(p => p.id);
        console.log('📋 Found product IDs:', foundProductIds);
        
        const missingProducts = expectedProductIds.filter(id => !foundProductIds.includes(id));
        if (missingProducts.length > 0) {
            console.warn('⚠️ Missing expected products:', missingProducts);
        }
        
        // Save to cache for next time
        localStorage.setItem('storefront_products', JSON.stringify(products));
        localStorage.setItem('storefront_products_updated', new Date().toISOString());
        
        console.log('✅ Loaded fresh from JSON file:', products.length, 'products');
        return products.filter(p => p && p.id);
        
    } catch (error) {
        console.error('❌ Failed to load from JSON:', error);
        
        // Final fallback - try without cache bust
        try {
            console.log('🔄 Trying final fallback without cache bust...');
            const response = await fetch('data/products.json');
            if (!response.ok) throw new Error('Failed to load products');
            products = await response.json();
            
            localStorage.setItem('storefront_products', JSON.stringify(products));
            localStorage.setItem('storefront_products_updated', new Date().toISOString());
            
            console.log('✅ Loaded from JSON (fallback):', products.length, 'products');
            return products.filter(p => p && p.id);
        } catch (fallbackError) {
            console.error('❌ All loading strategies failed:', fallbackError);
            throw new Error('Unable to load products. Please check your internet connection and try again.');
        }
    }
}

// Convert admin inventory format to storefront format
function convertInventoryToStorefront(inventoryProducts) {
    if (!Array.isArray(inventoryProducts)) return [];
    
    return inventoryProducts.map(product => {
        if (!product) return null;
        
        const totalStock = product.colorStock ? 
            Object.values(product.colorStock).reduce((sum, stock) => sum + (stock || 0), 0) : 
            (product.stock || 0);
            
        return {
            id: product.id || Math.random().toString(36).substr(2, 9),
            title: product.name || product.title || 'Untitled Product',
            price: product.price || 0,
            originalPrice: product.originalPrice || product.originalData?.originalPrice,
            currency: product.currency || product.originalData?.currency || 'KES',
            description: product.description || '',
            images: product.images || product.originalData?.images || [product.image].filter(Boolean) || ['https://via.placeholder.com/300x300?text=No+Image'],
            colors: product.colors || [],
            sizes: product.sizes || product.originalData?.sizes,
            models: product.models || product.originalData?.models,
            specs: product.specs || product.originalData?.specs,
            available_status: product.available_status || product.originalData?.available_status,
            sku: product.sku || product.originalData?.sku,
            stock: totalStock,
            category: product.category,
            colorStock: product.colorStock,
            availableColors: product.availableColors,
            tags: product.tags || []
        };
    }).filter(Boolean);
}

// Render products grid with Kenya SEO enhancements
function renderProductsGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (!Array.isArray(products) || products.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 1.2em; margin-bottom: 15px;">📦</div>
                <div style="margin-bottom: 10px;">No Products Available</div>
                <small>Check back later for new arrivals in Kenya</small>
            </div>
        `;
        return;
    }

    products.forEach(p => {
        if (!p || !p.id) return;
        
        const availableStock = getProductStock(p);
        const isThermalPrinter = isProductThermalPrinter(p);
        const stockStatus = getStockStatus(availableStock, isThermalPrinter);
        const stockText = getStockText(availableStock, isThermalPrinter);
        const isAvailable = availableStock > 0 && hasAvailableColors(p) || isThermalPrinter;

        const el = document.createElement('a');
        el.className = `product-card ${!isAvailable && !isThermalPrinter ? 'out-of-stock' : ''}`;
        el.href = `product.html?id=${encodeURIComponent(p.id)}`;
        
        const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/300x300?text=No+Image';
        const price = p.price || 0;
        const originalPrice = p.originalPrice;
        const currency = p.currency || 'KES';
        
        el.innerHTML = `
            <img src="${firstImage}" alt="${p.title || 'Product'} - Buy in Kenya" 
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"/>
            <h3>${p.title || 'Untitled Product'}</h3>
            <div class="price">
                ${originalPrice && originalPrice > price ? `
                    <span class="original-price">${currency} ${originalPrice.toLocaleString()}</span>
                ` : ''}
                <span class="current-price">${currency} ${price.toLocaleString()}</span>
            </div>
            <div class="product-stock stock-${stockStatus}">
                ${stockText} ${availableStock > 0 && !isThermalPrinter ? `• ${availableStock} units available in Kenya` : ''}
                ${isThermalPrinter ? '• Importing: 5-7 days' : ''}
            </div>
            ${!isAvailable && !isThermalPrinter ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            ${isThermalPrinter ? '<div class="special-order-badge">Available on Order</div>' : ''}
        `;
        
        grid.appendChild(el);
    });

    // Add Kenya SEO structured data
    addProductsStructuredData(products);
}

// Helper functions with thermal printer support
function getProductStock(product) {
    if (!product) return 0;
    
    if (product.colorStock && Object.keys(product.colorStock).length > 0) {
        return Object.values(product.colorStock).reduce((sum, stock) => sum + (stock || 0), 0);
    }
    return product.stock || 0;
}

function isProductThermalPrinter(product) {
    if (!product) return false;
    
    const title = (product.title || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const tags = Array.isArray(product.tags) ? product.tags : [];
    
    return title.includes('thermal') || 
           category.includes('thermal') ||
           tags.some(tag => tag.toLowerCase().includes('thermal'));
}

function getStockStatus(stock, isThermalPrinter = false) {
    if (isThermalPrinter) return 'special-order';
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
}

function getStockText(stock, isThermalPrinter = false) {
    if (isThermalPrinter) return 'Available on Order';
    if (stock > 10) return 'In Stock Kenya';
    if (stock > 0) return 'Low Stock Kenya';
    return 'Out of Stock Kenya';
}

function hasAvailableColors(product) {
    return !product.availableColors || product.availableColors.length > 0;
}

// Add this function to filter products by category
function filterProductsByCategory(products, categoryId) {
    if (!categoryId || categoryId === 'all') return products;
    if (!Array.isArray(products)) return [];
    
    return products.filter(product => {
        if (!product) return false;
        
        // Match by category ID or name
        const productCategory = (product.category || '').toLowerCase();
        const targetCategory = categoryId.toLowerCase();
        
        // Check if product category matches the target category
        // Also allow partial matches for flexibility
        return productCategory.includes(targetCategory) || 
               (product.title || '').toLowerCase().includes(targetCategory) ||
               (Array.isArray(product.tags) && product.tags.some(tag => 
                   tag.toLowerCase().includes(targetCategory)
               ));
    });
}

function showErrorState(error) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="margin-bottom: 15px; font-size: 3em; color: #dc3545;">⚠️</div>
            <div style="margin-bottom: 10px; font-weight: bold;">Unable to Load Products in Kenya</div>
            <p style="margin-bottom: 20px; font-size: 0.9em;">
                ${error.message || 'Please check your internet connection and try again.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Try Again
                </button>
                <button onclick="clearAllCache()" 
                        style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Clear Cache
                </button>
            </div>
        </div>
    `;
}

// Cache management
function clearAllCache() {
    const keysToKeep = ['de_cart', 'admin_token', 'admin_logged_in', 'deenice_categories', 'cache_version'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('product') || key.includes('inventory') || key.includes('storefront'))) {
            if (!keysToKeep.includes(key)) {
                keysToRemove.push(key);
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('Removed cache:', key);
    });
    
    alert('Cache cleared! Page will reload...');
    setTimeout(() => location.reload(), 1000);
}

// Update cart count function
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
        const badge = document.getElementById('cart-count');
        if (badge) {
            const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;
            badge.textContent = totalItems;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Enhanced Kenya SEO Structured Data
function addProductsStructuredData(products) {
    if (!Array.isArray(products) || products.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    
    const itemListElement = products.slice(0, 10).map((product, index) => {
        if (!product) return null;
        
        const availableStock = getProductStock(product);
        const isThermalPrinter = isProductThermalPrinter(product);
        
        return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Product",
                "name": product.title || 'Product',
                "description": product.description || '',
                "image": Array.isArray(product.images) ? product.images[0] : '',
                "offers": {
                    "@type": "Offer",
                    "price": product.price || 0,
                    "priceCurrency": product.currency || "KES",
                    "availability": isThermalPrinter ? "https://schema.org/PreOrder" : 
                                   (availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"),
                    "url": `https://www.deenice.store/product.html?id=${product.id}`,
                    "areaServed": "KE",
                    "availableDeliveryMethod": "https://schema.org/ParcelService"
                }
            }
        };
    }).filter(Boolean);

    const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.deenice.store"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": category ? `${category.charAt(0).toUpperCase() + category.slice(1)} in Kenya` : "All Products Kenya",
                "item": `https://www.deenice.store/products.html${category ? `?cat=${category}` : ''}`
            }
        ]
    };

    const productCollection = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products in Kenya` : "Tech Products in Kenya",
        "description": category ? 
            `Buy ${category} in Kenya. Best prices with delivery nationwide. M-Pesa accepted.` :
            "Shop all tech products in Kenya. Phones, earbuds, accessories with delivery nationwide.",
        "numberOfItems": products.length,
        "itemListElement": itemListElement
    };

    // Remove existing structured data
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"][data-kenya-seo]');
    existingSchemas.forEach(schema => schema.remove());

    // Add new structured data
    [breadcrumbList, productCollection].forEach(schema => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-kenya-seo', 'true');
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    });

    console.log('✅ Added Kenya SEO structured data for', products.length, 'products');
}

// Listen for storage events
window.addEventListener('storage', function(e) {
    if (e.key === 'storefront_products' || e.key === 'inventory_products') {
        console.log('Products updated, reloading...');
        setTimeout(() => {
            loadAndRenderProducts();
        }, 500);
    }
    
    if (e.key === 'de_cart') {
        updateCartCount();
    }
    
    if (e.key === 'deenice_categories') {
        console.log('Categories updated, reloading products...');
        setTimeout(() => {
            loadAndRenderProducts();
        }, 500);
    }
});

// Also listen for custom events from categories manager
window.addEventListener('categoriesUpdated', function() {
    console.log('Categories updated event received, reloading products...');
    setTimeout(() => {
        loadAndRenderProducts();
    }, 300);
});

// Add Kenya-focused hidden SEO content
function addHiddenSEOContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    
    const hiddenSeoContent = document.createElement('div');
    hiddenSeoContent.style.display = 'none';
    hiddenSeoContent.setAttribute('aria-hidden', 'true');
    
    if (category) {
        hiddenSeoContent.innerHTML = `
            <h2>Buy ${category} in Kenya</h2>
            <p>Shop best ${category} products in Kenya. Available in Nairobi, Mombasa, Kisumu with nationwide delivery. M-Pesa payments accepted across Kenya.</p>
            <p>Kenya tech products, ${category} Nairobi, buy ${category} online Kenya.</p>
        `;
    } else {
        hiddenSeoContent.innerHTML = `
            <h2>Tech Products Kenya</h2>
            <p>Buy phones, earbuds, tech accessories in Kenya. Best prices in Nairobi, Mombasa, Kisumu with nationwide delivery. M-Pesa payments accepted.</p>
            <p>Kenya tech shop, phones Kenya, earbuds Nairobi, mobile accessories Kenya, buy gadgets online Kenya.</p>
        `;
    }
    
    document.body.appendChild(hiddenSeoContent);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page DOM loaded - Kenya SEO Enhanced');
    addHiddenSEOContent();
});

// Export for global access
window.refreshProducts = loadAndRenderProducts;
window.clearAllCache = clearAllCache;
window.filterProductsByCategory = filterProductsByCategory;
