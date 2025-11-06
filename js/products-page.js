// products-page.js - FOR PRODUCTS LISTING PAGE
(async function(){
    const grid = document.getElementById('products-grid');
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }

    // Show proper loading state
    grid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 1.2em; margin-bottom: 15px;">🔄</div>
            <div style="margin-bottom: 10px;">Loading Products...</div>
            <small>Please wait while we load the latest inventory</small>
        </div>
    `;

    try {
        await loadAndRenderProducts();
        updateCartCount();
        console.log('✅ Products loaded successfully');

    } catch (error) {
        console.error('❌ Error loading products:', error);
        showErrorState(error);
    }
})();

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
                <div style="font-size: 1.2em; margin-bottom: 15px;">${category ? '🔍' : '😔'}</div>
                <div style="margin-bottom: 10px;">
                    ${category ? `No products found in "${category}" category` : 'No Products Available'}
                </div>
                <small>${category ? 'Try browsing all products or check back later.' : 'Check back later for new arrivals'}</small>
                ${category ? `
                    <div style="margin-top: 15px;">
                        <button onclick="window.location.href='products.html'" 
                                style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            View All Products
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        return;
    }

    renderProductsGrid(products);
    
    // Update page title and heading with category
    if (category && category !== 'all') {
        const categories = typeof categoriesManager !== 'undefined' ? categoriesManager.getCategories() : [];
        const currentCategory = categories.find(cat => cat.id === category);
        
        if (currentCategory) {
            document.title = `${currentCategory.name} — Deenice Finds`;
            
            // Update the page heading
            const pageHeading = document.querySelector('h1');
            if (pageHeading) {
                pageHeading.textContent = currentCategory.name;
                pageHeading.innerHTML = `${currentCategory.icon} ${currentCategory.name}`;
            }
        } else {
            // Fallback for unknown categories
            document.title = `${category.charAt(0).toUpperCase() + category.slice(1)} — Deenice Finds`;
            
            const pageHeading = document.querySelector('h1');
            if (pageHeading) {
                pageHeading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            }
        }
    }
    
    console.log('✅ Rendered', products.length, 'products for category:', category || 'all');
}

// Product loading logic
async function loadProductsUniversal() {
    let products = [];
    
    // STRATEGY 1: Try storefront_products (admin updates)
    try {
        const storefrontProducts = localStorage.getItem('storefront_products');
        
        if (storefrontProducts) {
            products = JSON.parse(storefrontProducts);
            console.log('✅ Loaded from storefront cache:', products.length, 'products');
            return products;
        }
    } catch (e) {
        console.log('❌ Storefront cache error, trying next source...');
    }
    
    // STRATEGY 2: Try inventory_products (admin raw data)
    try {
        const inventoryProducts = localStorage.getItem('inventory_products');
        if (inventoryProducts) {
            products = convertInventoryToStorefront(JSON.parse(inventoryProducts));
            console.log('✅ Loaded from inventory cache:', products.length, 'products');
            // Update storefront for next time
            localStorage.setItem('storefront_products', JSON.stringify(products));
            localStorage.setItem('storefront_products_updated', new Date().toISOString());
            return products;
        }
    } catch (e) {
        console.log('❌ Inventory cache error, trying JSON...');
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

// Render products grid
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
                ${stockText} ${availableStock > 0 ? `• ${availableStock} units available` : ''}
            </div>
            ${!isAvailable ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
        `;
        
        grid.appendChild(el);
    });
}

// Helper functions
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

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add this function to filter products by category
function filterProductsByCategory(products, categoryId) {
    if (!categoryId || categoryId === 'all') return products;
    
    return products.filter(product => {
        // Match by category ID or name
        const productCategory = product.category?.toLowerCase() || '';
        const targetCategory = categoryId.toLowerCase();
        
        // Check if product category matches the target category
        // Also allow partial matches for flexibility
        return productCategory.includes(targetCategory) || 
               product.title.toLowerCase().includes(targetCategory) ||
               (product.tags && Array.isArray(product.tags) && product.tags.some(tag => 
                   tag.toLowerCase().includes(targetCategory)
               ));
    });
}

function showErrorState(error) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 1.2em; margin-bottom: 15px;">❌</div>
            <div style="margin-bottom: 10px; font-weight: bold;">Unable to Load Products</div>
            <p style="margin-bottom: 20px; font-size: 0.9em;">
                ${error.message || 'Please check your internet connection and try again.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Try Again
                </button>
                <button onclick="clearAllCache()" 
                        style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🧹 Clear Cache
                </button>
            </div>
        </div>
    `;
}

// Cache management
function clearAllCache() {
    const keysToKeep = ['de_cart', 'admin_token', 'admin_logged_in', 'deenice_categories'];
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
    
    alert('Cache cleared! Page will reload...');
    setTimeout(() => location.reload(), 1000);
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

// Listen for storage events
window.addEventListener('storage', function(e) {
    if (e.key === 'storefront_products' || e.key === 'inventory_products') {
        console.log('🔄 Products updated, reloading...');
        setTimeout(() => {
            loadAndRenderProducts();
        }, 500);
    }
    
    if (e.key === 'de_cart') {
        updateCartCount();
    }
    
    if (e.key === 'deenice_categories') {
        console.log('🔄 Categories updated, reloading products...');
        setTimeout(() => {
            loadAndRenderProducts();
        }, 500);
    }
});

// Also listen for custom events from categories manager
window.addEventListener('categoriesUpdated', function() {
    console.log('🔄 Categories updated event received, reloading products...');
    setTimeout(() => {
        loadAndRenderProducts();
    }, 300);
});

// Export for global access
window.refreshProducts = loadAndRenderProducts;
window.clearAllCache = clearAllCache;
window.filterProductsByCategory = filterProductsByCategory;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Products page DOM loaded');
    // Categories will be handled by categories-manager.js
});
