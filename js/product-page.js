(async () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const container = document.getElementById('product-page');
    let data = [];
    let p = null;

    // --- ENHANCED ERROR HANDLING FOR JSON FETCH ---
    try {
        const res = await fetch('data/products.json');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        data = await res.json();
        
        // Find the product by ID, fallback to the first product if not found
        p = data.find(x => x.id === id) || data[0]; 

    } catch (error) {
        console.error("Critical Error: Failed to fetch or parse products.json. Check JSON syntax!", error);
        if (container) {
            container.innerHTML = `<p>Error loading product data. Please check the browser console for details.</p>`;
        }
        return; // Stop execution if data failed to load
    }
    // --- END ERROR HANDLING ---

    // Stop if no product or container found
    if (!p || !container) {
        console.warn("Product or container element not found.");
        return;
    }


    // 3. Initialize Price and Size Variables
    // Default to first size price/label if 'sizes' array exists, otherwise use product's base price.
    let currentPrice = p.sizes && p.sizes.length > 0 ? p.sizes[0].price : p.price;
    let selectedSize = p.sizes && p.sizes.length > 0 ? p.sizes[0].label : null;

    // 4. Calculate Discount Information based on currentPrice
    const hasDiscount = p.originalPrice && p.originalPrice > currentPrice;
    const discountAmount = hasDiscount ? p.originalPrice - currentPrice : 0;
    const saveText = hasDiscount ? `Save ${p.currency} ${discountAmount.toLocaleString()}` : "";

    // 5. Build and Render the Product Page HTML
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
                <span id="product-price" class="current-price">${p.currency} ${currentPrice.toLocaleString()}</span>
                ${hasDiscount ? `<span class="old-price">${p.currency} ${p.originalPrice.toLocaleString()}</span>` : ""}
                ${hasDiscount ? `<span class="discount-tag">${saveText}</span>` : ""}
            </div>

            <p><em>${p.description}</em></p>

            ${p.colors && p.colors.length > 0 ? `
            <div class="color-options">
                ${p.colors.map((c, idx) => `
                    <div class="color-item">
                        <div class="color-name">${c.name}</div>
                        <div class="color-option ${idx === 0 ? 'selected' : ''}" data-img="${c.img}" data-name="${c.name}">
                            <img src="${c.img}" alt="${c.name}">
                        </div>
                    </div>
                `).join('')}
            </div>` : ''}

            ${p.sizes && p.sizes.length > 0 ? `
            <div class="size-options">
                <label for="size-select">Choose size:</label>
                <select id="size-select">
                    ${p.sizes.map(s => `<option value="${s.label}" data-price="${s.price}">${s.label}</option>`).join('')}
                </select>
            </div>` : ''}

            <label>Quantity:
                <input id="qty" type="number" value="1" min="1" max="${p.stock}" />
            </label>

            <button id="add-cart" class="primary">Add to Cart</button>
        </div>
    `;


    // 6. Add Event Listeners for User Interactions
    // (Listeners are placed outside the innerHTML assignment)

    // Thumbnail switching
    document.querySelectorAll('.product-thumbs img').forEach(img => {
        img.addEventListener('click', () => {
            document.getElementById('main-image').src = img.dataset.src;
            document.querySelectorAll('.product-thumbs img').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        });
    });

    // Color selection
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            document.getElementById('main-image').src = opt.dataset.img;
        });
    });

    // Size selection (price updates)
    const sizeSelect = document.getElementById('size-select');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            const sel = sizeSelect.options[sizeSelect.selectedIndex];
            selectedSize = sel.value;
            currentPrice = Number(sel.dataset.price);
            document.getElementById('product-price').textContent = `${p.currency} ${currentPrice.toLocaleString()}`;
        });
    }

    // Add to Cart
    document.getElementById('add-cart').addEventListener('click', () => {
        const qty = Number(document.getElementById('qty').value || 1);
        const colorEl = document.querySelector('.color-option.selected');
        const color = colorEl ? colorEl.dataset.name : 'Default';
        const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');

        cart.push({
            id: p.id,
            title: p.title,
            price: currentPrice,
            currency: p.currency,
            qty,
            color,
            size: selectedSize || 'Standard',
            img: p.images[0] // Save product image for cart display
        });

        localStorage.setItem('de_cart', JSON.stringify(cart));
        alert('Added to cart');
        
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = cart.length;
    });
})();
