// Updated Product Data with categories
const products = [
    {
        id: 1,
        name: "Magsafe Battery Pack 10,000Mah",
        price: 3900,
        description: "Portable Magnetic Wireless Power Bank (10000 mAh) 🔋 This Powerseed PS-A156 portable power bank is engineered for the modern traveler...",
        fullDescription: `
            <p>This Powerseed PS-A156 portable power bank is engineered for the modern traveler, offering a blend of high capacity, versatile charging, and robust protection in a stylish, compact design.</p>
            
            <h4>Key Features & Design ✨</h4>
            <p><strong>Capacity & Power:</strong> Built with a reliable 10,000 mAh Li-Polymer Battery, it provides ample power for all-day use. It delivers a maximum output power of 38.5W to quickly charge your devices.</p>
            
            <p><strong>Magnetic Wireless Charging:</strong> Features a magnetic wireless charging function, making it incredibly convenient for supported devices like mobile phones and smart watches.</p>
            
            <p><strong>Integrated Display:</strong> An LED Display clearly shows the remaining power, ensuring you're never caught off guard.</p>
            
            <h4>Connectivity & Usage 🔌</h4>
            <p><strong>Input & Output:</strong> Both the input and main output interfaces are modern and universal Type-C ports.</p>
            
            <p><strong>Versatile Usage:</strong> The portable and compact style (68×108.6×23.6mm, weighing only 215g) is specifically designed for Outdoor Traveling and everyday use.</p>
        `,
        specifications: [
            { name: "Capacity", value: "10,000 mAh" },
            { name: "Output", value: "38.5W Max" },
            { name: "Input", value: "Type-C" },
            { name: "Weight", value: "215g" },
            { name: "Dimensions", value: "68×108.6×23.6mm" },
            { name: "Charging", value: "Magnetic Wireless + Type-C" }
        ],
        images: [
            "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg",
            "https://i.postimg.cc/D03nz6zL/Screenshot-2025-10-15-201118.png",
            "https://i.postimg.cc/RZpmt4Fx/image.png",
            "https://i.postimg.cc/kgHr4s1R/image.png",
            "https://i.postimg.cc/V6LXV9wM/image.png"
        ],
        colors: [
            { name: "White", image: "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg" },
            { name: "Black", image: "https://i.postimg.cc/NGRrkPRs/Hf7fb927b9b97487da96fbd5dd5bc6badx.jpg" },
            { name: "Blue", image: "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg" },
            { name: "Pink", image: "https://i.postimg.cc/NGRrkPRs/Hf7fb927b9b97487da96fbd5dd5bc6badx.jpg" }
        ],
        category: "power-banks",
        featured: true
    },
    // Add other products with categories...
];

// Render Products with categories
function renderProducts(productsToRender = products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category);
        productCard.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">KES ${product.price.toLocaleString()}</div>
                <p class="product-description">${product.description}</p>
                <a href="product-detail.html?id=${product.id}" class="product-view-btn">View Details</a>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
}

// Display Product Detail
function displayProductDetail(product) {
    const productDetail = document.getElementById('product-detail');
    const breadcrumb = document.getElementById('product-breadcrumb');
    
    if (productDetail && breadcrumb) {
        breadcrumb.textContent = product.name;
        
        productDetail.innerHTML = `
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.images[0]}" alt="${product.name}" id="main-product-image">
                </div>
                <div class="thumbnail-images">
                    ${product.images.map((image, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" data-image="${image}">
                            <img src="${image}" alt="${product.name}">
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="product-details">
                <h1 class="product-name">${product.name}</h1>
                <div class="product-price">KES ${product.price.toLocaleString()}</div>
                <p class="product-description">${product.description}</p>
                
                <div class="product-options">
                    <div class="option-title">Select Color:</div>
                    <div class="color-options">
                        ${product.colors.map((color, index) => `
                            <div class="color-option ${index === 0 ? 'selected' : ''}" data-color="${color.name}" data-image="${color.image}">
                                <img src="${color.image}" alt="${color.name}">
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="quantity-selector">
                        <div class="option-title">Quantity:</div>
                        <button class="quantity-btn" id="decrease-quantity">-</button>
                        <span class="quantity-value" id="quantity-value">1</span>
                        <button class="quantity-btn" id="increase-quantity">+</button>
                    </div>
                    
                    <button class="add-to-cart" id="add-to-cart">Add to Cart</button>
                    <button class="buy-now" id="buy-now">Buy Now</button>
                </div>
            </div>
        `;
        
        // Update page title and meta description
        document.title = `${product.name} - Deenice Finds | Premium Tech Products`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', product.description);
        }
        
        // Load full description and specifications
        document.getElementById('product-full-description').innerHTML = product.fullDescription || product.description;
        
        if (product.specifications) {
            const specsHTML = product.specifications.map(spec => `
                <div class="spec-item">
                    <strong>${spec.name}:</strong>
                    <span>${spec.value}</span>
                </div>
            `).join('');
            document.getElementById('product-specifications').innerHTML = specsHTML;
        }
        
        setupProductPageEvents();
    }
}

// Load Related Products
function loadRelatedProducts(currentProduct) {
    const relatedProducts = document.getElementById('related-products');
    if (!relatedProducts) return;
    
    const related = products
        .filter(product => product.id !== currentProduct.id && product.category === currentProduct.category)
        .slice(0, 4);
    
    if (related.length > 0) {
        let relatedHTML = '';
        related.forEach(product => {
            relatedHTML += `
                <div class="product-card">
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">KES ${product.price.toLocaleString()}</div>
                        <p class="product-description">${product.description}</p>
                        <a href="product-detail.html?id=${product.id}" class="product-view-btn">View Details</a>
                    </div>
                </div>
            `;
        });
        relatedProducts.innerHTML = relatedHTML;
    }
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a product detail page
    if (window.location.pathname.includes('product-detail.html')) {
        loadProductDetail();
    } else {
        // Render all products on products page
        renderProducts();
    }
    
    // Render featured products on home page
    const featuredProducts = document.getElementById('featured-products');
    if (featuredProducts) {
        const featuredProductsData = products.filter(product => product.featured).slice(0, 8);
        let featuredHTML = '';
        featuredProductsData.forEach(product => {
            featuredHTML += `
                <div class="product-card">
                    <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">KES ${product.price.toLocaleString()}</div>
                        <p class="product-description">${product.description}</p>
                        <a href="product-detail.html?id=${product.id}" class="product-view-btn">View Details</a>
                    </div>
                </div>
            `;
        });
        featuredProducts.innerHTML = featuredHTML;
    }
});