// ENHANCED products-page.js with stock validation
(async function(){
    const grid = document.getElementById('products-grid'); // Changed from 'product-grid' to match your HTML
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }

    try {
        // Try to load from storefront_products first (admin updates)
        let products = [];
        const storefrontProducts = localStorage.getItem('storefront_products');
        
        if (storefrontProducts) {
            products = JSON.parse(storefrontProducts);
            console.log('📦 Loaded products from storefront cache:', products.length);
        } else {
            // Fallback to original JSON file
            const res = await fetch('data/products.json');
            if (!res.ok) throw new Error('Failed to load products');
            products = await res.json();
            console.log('📦 Loaded products from JSON file:', products.length);
        }

        // Enhanced: Calculate available stock for each product
        function getProductStock(product) {
            if (product.colorStock && Object.keys(product.colorStock).length > 0) {
                return Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0);
            }
            return product.stock || 0;
        }

        // Clear loading message
        grid.innerHTML = '';

        products.forEach(p => {
            const availableStock = getProductStock(p);
            const stockStatus = availableStock > 10 ? 'in-stock' : 
                              availableStock > 0 ? 'low-stock' : 'out-of-stock';
            const stockText = availableStock > 10 ? 'In Stock' : 
                            availableStock > 0 ? 'Low Stock' : 'Out of Stock';
            
            // Check if product has any available colors
            const hasAvailableColors = !p.availableColors || p.availableColors.length > 0;
            const isAvailable = availableStock > 0 && hasAvailableColors;

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
                    ${stockText} • ${availableStock} units
                </div>
                ${!isAvailable ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            `;
            
            grid.appendChild(el);
        });

        // Update cart count
        updateCartCount();

    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 40px; color: #666;">
                <p>Unable to load products at the moment.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
})();

// Update cart count function
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = totalItems;
    }
}

// Listen for cart updates from other pages
window.addEventListener('storage', function(e) {
    if (e.key === 'de_cart') {
        updateCartCount();
    }
});
