// featured-products.js - FOR HOMEPAGE FEATURED PRODUCTS
(async function() {
    const featuredGrid = document.getElementById('product-grid');
    
    if (!featuredGrid) {
        console.log('Featured products grid not found - might not be on homepage');
        return;
    }

    console.log('Loading featured products for homepage...');

    try {
        await loadAndRenderFeaturedProducts();
        console.log('✅ Featured products loaded successfully');
    } catch (error) {
        console.error('❌ Error loading featured products:', error);
        showFeaturedProductsError(error);
    }
})();

async function loadAndRenderFeaturedProducts() {
    const featuredGrid = document.getElementById('product-grid');
    
    if (!featuredGrid) return;

    // Show loading state
    featuredGrid.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666; grid-column: 1 / -1;">
            <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <div style="margin-bottom: 10px;">Loading Featured Products in Kenya...</div>
            <small>Curating the best tech products for our Kenyan customers</small>
        </div>
    `;

    // Load all products
    let products = await loadProductsUniversal();
    
    if (!products || products.length === 0) {
        featuredGrid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666; grid-column: 1 / -1;">
                <div style="margin-bottom: 15px; font-size: 2em; color: #6c757d;">●</div>
                <div style="margin-bottom: 10px;">No Featured Products Available</div>
                <small>Check back soon for new arrivals in Kenya</small>
                <div style="margin-top: 20px;">
                    <a href="products.html" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View All Products
                    </a>
                </div>
            </div>
        `;
        return;
    }

    // Filter featured products (you can customize this logic)
    const featuredProducts = getFeaturedProducts(products);
    
    if (featuredProducts.length === 0) {
        // If no featured products found, show first 6 products
        renderFeaturedProducts(products.slice(0, 6));
    } else {
        renderFeaturedProducts(featuredProducts);
    }
}

function getFeaturedProducts(products) {
    // Strategy 1: Look for products marked as featured
    let featured = products.filter(p => p.featured === true || p.tags?.includes('featured'));
    
    // Strategy 2: If no featured products, get best-selling or high-rated products
    if (featured.length === 0) {
        featured = products
            .sort((a, b) => {
                // Sort by rating (if available) or by stock level
                const aRating = a.rating || 0;
                const bRating = b.rating || 0;
                const aStock = getProductStock(a);
                const bStock = getProductStock(b);
                
                // Prioritize products with ratings and good stock
                if (aRating > bRating) return -1;
                if (aRating < bRating) return 1;
                return bStock - aStock;
            })
            .slice(0, 8); // Get top 8 products
    }
    
    // Strategy 3: Ensure we have products in stock
    featured = featured.filter(p => getProductStock(p) > 0 || isProductThermalPrinter(p));
    
    return featured.slice(0, 8); // Limit to 8 featured products
}

function renderFeaturedProducts(products) {
    const featuredGrid = document.getElementById('product-grid');
    
    if (!featuredGrid) return;

    featuredGrid.innerHTML = '';

    products.forEach(product => {
        const availableStock = getProductStock(product);
        const isThermalPrinter = isProductThermalPrinter(product);
        const stockStatus = getStockStatus(availableStock, isThermalPrinter);
        const stockText = getStockText(availableStock, isThermalPrinter);
        const isAvailable = availableStock > 0 && hasAvailableColors(product) || isThermalPrinter;

        const productEl = document.createElement('a');
        productEl.className = `product-card ${!isAvailable && !isThermalPrinter ? 'out-of-stock' : ''}`;
        productEl.href = `product.html?id=${encodeURIComponent(product.id)}`;
        
        productEl.innerHTML = `
            <img src="${product.images[0]}" alt="${product.title} - Buy in Kenya" 
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"/>
            <h3>${product.title}</h3>
            <div class="price">
                ${product.originalPrice ? `
                    <span class="original-price">${product.currency} ${product.originalPrice.toLocaleString()}</span>
                ` : ''}
                <span class="current-price">${product.currency} ${product.price.toLocaleString()}</span>
            </div>
            <div class="product-stock stock-${stockStatus}">
                ${stockText} ${availableStock > 0 && !isThermalPrinter ? `• ${availableStock} available` : ''}
                ${isThermalPrinter ? '• Importing: 5-7 days' : ''}
            </div>
            ${!isAvailable && !isThermalPrinter ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            ${isThermalPrinter ? '<div class="special-order-badge">Available on Order</div>' : ''}
        `;
        
        featuredGrid.appendChild(productEl);
    });

    // Add Kenya SEO structured data for featured products
    addFeaturedProductsStructuredData(products);
}

// Reuse these helper functions from products-page.js
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
        
        localStorage.setItem('storefront_products', JSON.stringify(products));
        localStorage.setItem('storefront_products_updated', new Date().toISOString());
        
        console.log('✅ Loaded from JSON file:', products.length, 'products');
        return products;
    } catch (error) {
        console.error('❌ Failed to load from JSON:', error);
        throw error;
    }
}

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
            availableColors: product.availableColors,
            tags: product.tags || [],
            rating: product.rating,
            featured: product.featured
        };
    });
}

function getProductStock(product) {
    if (product.colorStock && Object.keys(product.colorStock).length > 0) {
        return Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0);
    }
    return product.stock || 0;
}

function isProductThermalPrinter(product) {
    return product.title.toLowerCase().includes('thermal') || 
           product.category && product.category.toLowerCase().includes('thermal') ||
           product.tags && product.tags.some(tag => tag.toLowerCase().includes('thermal'));
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

function showFeaturedProductsError(error) {
    const featuredGrid = document.getElementById('product-grid');
    if (!featuredGrid) return;

    featuredGrid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666; grid-column: 1 / -1;">
            <div style="margin-bottom: 15px; font-size: 2em; color: #dc3545;">●</div>
            <div style="margin-bottom: 10px; font-weight: bold;">Unable to Load Featured Products</div>
            <p style="margin-bottom: 20px; font-size: 0.9em;">
                ${error.message || 'Please check your internet connection and try again.'}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="location.reload()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Try Again
                </button>
                <button onclick="loadAndRenderFeaturedProducts()" 
                        style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Reload Products
                </button>
            </div>
        </div>
    `;
}

function addFeaturedProductsStructuredData(products) {
    const itemListElement = products.slice(0, 6).map((product, index) => {
        const availableStock = getProductStock(product);
        const isThermalPrinter = isProductThermalPrinter(product);
        
        return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Product",
                "name": product.title,
                "description": product.description,
                "image": product.images[0],
                "offers": {
                    "@type": "Offer",
                    "price": product.price,
                    "priceCurrency": "KES",
                    "availability": isThermalPrinter ? "https://schema.org/PreOrder" : 
                                   (availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"),
                    "url": `https://www.deenice.store/product.html?id=${product.id}`,
                    "areaServed": "KE",
                    "availableDeliveryMethod": "https://schema.org/ParcelService"
                }
            }
        };
    });

    const featuredCollection = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Featured Tech Products in Kenya",
        "description": "Best-reviewed phones, earbuds and tech accessories available in Kenya with nationwide delivery and M-Pesa payments",
        "numberOfItems": products.length,
        "itemListElement": itemListElement
    };

    // Remove existing structured data
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"][data-featured-products]');
    existingSchemas.forEach(schema => schema.remove());

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-featured-products', 'true');
    script.text = JSON.stringify(featuredCollection);
    document.head.appendChild(script);

    console.log('✅ Added Kenya SEO structured data for featured products');
}

// Make functions globally available
window.loadAndRenderFeaturedProducts = loadAndRenderFeaturedProducts;
