(async () => {
    // 1. Get Product ID from URL
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    // 2. Fetch and Parse Product Data
    // Assumes 'data/products.json' is accessible
    const res = await fetch('data/products.json');
    const data = await res.json();
    
    // Find the product by ID, fallback to the first product if not found
    const p = data.find(x => x.id === id) || data[0]; 
    const container = document.getElementById('product-page');

    // 3. Calculate Discount Information
    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
    const discountAmount = hasDiscount ? p.originalPrice - p.price : 0;
    const saveText = hasDiscount ? `Save ${p.currency} ${discountAmount.toLocaleString()}` : "";

    // 4. Build and Render the Product Page HTML
    if (container && p) {
        container.innerHTML = `
            <div class="product-page-card">
                <div class="product-slideshow">
                    <div class="product-main">
                        <img id="main-image" 
                            src="${p.images[0]}" 
                            alt="${p.title}" 
                            style="width:100%;border-radius:12px"
                            onerror="this.onerror=null;this.src='images/placeholder.png';"/>
                    </div>
                    <div class="product-thumbs">
                        ${p.images.map((im, idx) => `
                            <img data-src="${im}" ${idx === 0 ? 'class="selected"' : ''} src="${im}" />
                        `).join('')}
                    </div>
                </div>

                <h2>${p.title}</h2>

                <div class="price-section">
                    <span class="current-price">${p.currency} ${p.price.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="old-price">${p.currency} ${p.originalPrice.toLocaleString()}</span>` : ""}
                    ${hasDiscount ? `<span class="discount-tag">${saveText}</span>` : ""}
                </div>

                <p><em>${p.description}</em></p>

                <div class="color-options">
                    ${p.colors.map((c, idx) => `
                        <div class="color-item">
                            <div class="color-name">${c.name}</div>
                            <div class="color-option ${idx === 0 ? 'selected' : ''}" data-img="${c.img}" data-name="${c.name}">
                                <img src="${c.img}" alt="${c.name}">
                            </div>
                        </div>
                    `).join('')}
                </div>

                <label>Quantity:
                    <input id="qty" type="number" value="1" min="1" max="${p.stock}" />
                </label>

                <button id="add-cart" class="primary">Add to Cart</button>
            </div>
        `;
    }

    // 5. Add Event Listeners for User Interactions

    // Thumbnail switching (changes the main image)
    document.querySelectorAll('.product-thumbs img').forEach(img => {
        img.addEventListener('click', () => {
            document.getElementById('main-image').src = img.dataset.src;
            // Update selected thumbnail class
            document.querySelectorAll('.product-thumbs img').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        });
    });

    // Color selection (changes selected color and main image)
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            // Update selected color class
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            
            // Change main image to the color-specific image
            const img = opt.dataset.img;
            document.getElementById('main-image').src = img;
        });
    });

    // Add to cart functionality
    const addButton = document.getElementById('add-cart');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const qty = Number(document.getElementById('qty').value || 1);
            const colorEl = document.querySelector('.color-option.selected');
            const color = colorEl ? colorEl.dataset.name : 'Default';
            
            // Get existing cart or start a new array
            const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
            
            // Add current product to cart
            cart.push({ 
                id: p.id, 
                title: p.title, 
                price: p.price, 
                currency: p.currency, 
                qty, 
                color,
                img: p.images[0] // Save product image for cart display
            });
            
            // Update localStorage and notify user
            localStorage.setItem('de_cart', JSON.stringify(cart));
            alert('Added to cart');
            
            // Update a visual cart count badge if it exists
            const badge = document.getElementById('cart-count');
            if (badge) badge.textContent = cart.length;
        });
    }
})();
