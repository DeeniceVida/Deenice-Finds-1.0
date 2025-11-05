// UNIVERSAL products-page.js - Works same on desktop and mobile
(async function(){
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }

    // Show loading state
    grid.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="margin-bottom: 10px;">🔄 Loading products...</div>
            <small>Checking latest inventory...</small>
        </div>
    `;

    try {
        await loadAndRenderProducts();
        updateCartCount();

    } catch (error) {
        console.error('Error loading products:', error);
        showErrorState(error);
    }
})();

async function loadAndRenderProducts() {
    const grid = document.getElementById('products-grid');
    
    console.log('📱 Device type:', isMobile() ? 'Mobile' : 'Desktop');
    console.log('🌐 Online status:', navigator.onLine ? 'Online' : 'Offline');

    // Clear any cached data that might cause inconsistencies
    clearProblematicCache();

    // UNIVERSAL LOADING STRATEGY - Same for all devices
    let products = await loadProductsUniversal();
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<p class="no-products">No products available at the moment.</p>';
        return;
    }

    renderProductsGrid(products);
    showLoadInfo(products.length);
}

// UNIVERSAL product loading - Same logic for all devices
async function loadProductsUniversal() {
    let products = [];
    
    // STRATEGY 1: Try storefront_products (admin updates)
    const storefrontProducts = localStorage.getItem('storefront_products');
    const storefrontUpdated = localStorage.getItem('storefront_products_updated');
    
    if (storefrontProducts && isRecentUpdate(storefrontUpdated)) {
        products = JSON.parse(storefrontProducts);
        console.log('✅ Loaded from storefront cache:', products.length, 'products');
        return products;
    }
    
    // STRATEGY 2: Try inventory_products (admin raw data)
    const inventoryProducts = localStorage.getItem('inventory_products');
    if (inventoryProducts) {
        products = convertInventoryToStorefront(JSON.parse(inventoryProducts));
        console.log('✅ Loaded from inventory cache:', products.length, 'products');
        // Update storefront for next time
        localStorage.setItem('storefront_products', JSON.stringify(products));
        localStorage.setItem('storefront_products_updated', new Date().toISOString());
        return products;
    }
    
    // STRATEGY 3: Load from JSON file (fresh data)
    console.log('📦 Loading fresh from JSON file...');
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        products = await response.json();
        
        // Save to cache for next time
        localStorage.setItem('storefront_products', JSON.stringify(products));
        localStorage.setItem('storefront_products_updated', new Date().toISOString());
        
        console.log('✅ Loaded from JSON file:', products.length, 'products');
        return products;
    } catch (error) {
        console.error('❌ Failed to load from JSON:', error);
        throw error;
    }
}

// Convert admin inventory format to storefront format
function convertInventoryToStorefront(inventoryProducts) {
    return inventoryProducts.map(product => {
        const totalStock = product.colorStock ? 
            Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 
            product.stock || 0;
            
        return {
            id: product.id,
            title: product.name,
            price: product.price,
            originalPrice: product.originalData?.originalPrice,
            currency: product.originalData?.currency || 'KES',
            description: product.description,
            images: product.originalData?.images || [product.image],
            colors: product.colors,
            sizes: product.originalData?.sizes,
            models: product.originalData?.models,
            specs: product.originalData?.specs,
            available_status: product.originalData?.available_status,
            sku: product.originalData?.sku,
            stock: totalStock,
            category: product.category,
            colorStock: product.colorStock,
            availableColors: product.availableColors
        };
    });
}

// Render products grid - Same for all devices
function renderProductsGrid(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.forEach(p => {
        const availableStock = getProductStock(p);
        const stockStatus = getStockStatus(availableStock);
        const stockText = getStockText(availableStock);
        const isAvailable = availableStock > 0 && hasAvailableColors(p);

        const el = document.createElement('a');
        el.className = `product-card ${!isAvailable ? 'out-of-stock' : ''}`;
        el.href = `product.html?id=${encodeURIComponent(p.id)}`;
        
        el.innerHTML = `
            <img src="${p.images[0]}" alt="${p.title}" 
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"/>
            <h3>${p.title}</h3>
            <div class="price">
                ${p.originalPrice ? `
                    <span class="original-price">${p.currency} ${p.originalPrice.toLocaleString()}</span>
                ` : ''}
                <span class="current-price">${p.currency} ${p.price.toLocaleString()}</span>
            </div>
            <div class="product-stock stock-${stockStatus}">
                ${stockText} • ${availableStock} units available
            </div>
            ${!isAvailable ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        `;
        
        grid.appendChild(el);
    });
}

// Helper functions - Same for all devices
function getProductStock(product) {
    if (product.colorStock && Object.keys(product.colorStock).length > 0) {
        return Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0);
    }
    return product.stock || 0;
}

function getStockStatus(stock) {
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
}

function getStockText(stock) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
}

function hasAvailableColors(product) {
    return !product.availableColors || product.availableColors.length > 0;
}

function isRecentUpdate(timestamp) {
    if (!timestamp) return false;
    const updateTime = new Date(timestamp);
    const now = new Date();
    return (now - updateTime) < (24 * 60 * 60 * 1000); // Within 24 hours
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function clearProblematicCache() {
    // Clear only problematic cache items that cause inconsistencies
    const problematicKeys = [
        'storefront_products_old',
        'inventory_products_old',
        'products_cache'
    ];
    
    problematicKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log('🧹 Cleared problematic cache:', key);
        }
    });
}

function showLoadInfo(productCount) {
    const source = localStorage.getItem('storefront_products') ? 'cache' : 'JSON';
    const lastUpdate = localStorage.getItem('storefront_products_updated');
    
    console.log('📊 Load Info:', {
        device: isMobile() ? 'mobile' : 'desktop',
        products: productCount,
        source: source,
        lastUpdate: lastUpdate,
        online: navigator.onLine
    });
}

function showErrorState(error) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 40px; color: #666;">
            <div style="margin-bottom: 15px;">
                <strong>Unable to load products</strong>
            </div>
            <p style="margin-bottom: 20px; font-size: 0.9em;">
                ${error.message || 'Please check your connection'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Try Again
                </button>
                <button onclick="clearAllCache()" 
                        style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🧹 Clear Cache
                </button>
            </div>
        </div>
    `;
}

// Cache management
function clearAllCache() {
    const keysToKeep = ['de_cart', 'admin_token', 'admin_logged_in'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('product') || key.includes('inventory') || key.includes('storefront')) {
            if (!keysToKeep.includes(key)) {
                keysToRemove.push(key);
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 Removed cache:', key);
    });
    
    alert('Cache cleared! Reloading...');
    location.reload();
}

// Update cart count function
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = totalItems;
    }
}

// Listen for storage events (cross-device sync)
window.addEventListener('storage', function(e) {
    console.log('🔄 Storage event:', e.key);
    
    if (e.key === 'storefront_products' || e.key === 'inventory_products') {
        console.log('📦 Products updated, reloading...');
        setTimeout(() => {
            loadAndRenderProducts();
        }, 500);
    }
    
    if (e.key === 'de_cart') {
        updateCartCount();
    }
});

// Export for global access
window.refreshProducts = loadAndRenderProducts;
window.clearAllCache = clearAllCache;
