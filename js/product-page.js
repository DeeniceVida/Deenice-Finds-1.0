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
    let currentPrice = p.sizes && p.sizes.length > 0 ? p.sizes[0].price : p.price;
    let selectedSize = p.sizes && p.sizes.length > 0 ? p.sizes[0].label : null;
    let selectedModel = p.models && p.models.length > 0 ? p.models[0] : null;

    // 4. Calculate Discount Information based on currentPrice
    const hasDiscount = p.originalPrice && p.originalPrice > currentPrice;
    const discountAmount = hasDiscount ? p.originalPrice - currentPrice : 0;
    const saveText = hasDiscount ? `Save ${p.currency} ${discountAmount.toLocaleString()}` : "";


    // ***********************************************
    // 🟢 NEW LOGIC: Availability Alert and Specs Table 🟢
    // ***********************************************

    let alertHtml = '';
    let specsHtml = '';

    // A. Build 'Order Only' Alert
    if (p.available_status) {
        alertHtml = `<div class="order-alert-box">
            ⚠️ *Note:* This product is ${p.available_status}.
        </div>`;
    }

    // B. Build Specifications Table
    if (p.specs && p.specs.length > 0) {
        specsHtml = '<section id="product-specs-container">';
        specsHtml += '<h3 class="specs-heading">Technical Specifications</h3>';
        specsHtml += '<table class="specs-table">';
        
        p.specs.forEach(spec => {
            specsHtml += `
                <tr>
                    <th>${spec.label}</th>
                    <td>${spec.value}</td>
                </tr>
            `;
        });
        
        specsHtml += '</table></section>';
    }

    // ***********************************************
    // 5. Build and Render the Product Page HTML (REVERTED TO STATIC GALLERY STRUCTURE)
    // ***********************************************
    container.innerHTML = `
        <div class="product-page-card">
            
            <div class="product-gallery">
                <div id="product-main-image-container">
                    <img id="product-main-image" 
                         src="${p.images[0]}" 
                         alt="${p.title}" 
                         onerror="this.onerror=null;this.src='images/placeholder.png';"/>
                </div>

                <div id="product-thumbnails">
                    ${p.images.map((im, idx) => `
                        <img data-index="${idx}" src="${im}" class="thumb-img ${idx === 0 ? 'selected' : ''}" />
                    `).join('')}
                </div>
            </div>
            <div id="product-details">
                ${alertHtml} <h2>${p.title}</h2>

                <div class="price-section">
                    <span id="product-price" class="current-price">${p.currency} ${currentPrice.toLocaleString()}</span>
                    ${hasDiscount ? `<span class="old-price">${p.currency} ${p.originalPrice.toLocaleString()}</span>` : ""}
                    ${hasDiscount ? `<span class="discount-tag">${saveText}</span>` : ""}
                </div>

                <div id="product-description-container" class="long-description">
                    <p><em>${p.description}</em></p>
                </div>

                ${p.colors && p.colors.length > 0 ? `
                <div id="color-selector">
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
                </div>
                ` : ''}

                ${p.sizes && p.sizes.length > 0 ? `
                <div class="size-options-container">
                    <label>Choose size:</label>
                    <div class="size-buttons" id="size-buttons-group">
                        ${p.sizes.map((s, idx) => `
                            <button class="size-button ${idx === 0 ? 'selected' : ''}" 
                                        data-size="${s.label}" 
                                        data-price="${s.price}">
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}
                
                ${p.models && p.models.length > 0 ? `
                <div class="model-options-container">
                    <label for="model-selector">Choose Model:</label>
                    <select id="model-selector" class="product-option-select">
                        ${p.models.map((model, idx) => `
                            <option value="${model}" ${idx === 0 ? 'selected' : ''}>
                                ${model}
                            </option>
                        `).join('')}
                    </select>
                </div>` : ''}

                <label>Quantity:
                    <input id="qty" type="number" value="1" min="1" max="${p.stock}" />
                </label>

                <button id="add-cart" class="primary">Add to Cart</button>
            </div>
            
            ${specsHtml} 
        </div>
    `;

    // 6. Add Event Listeners for User Interactions
    
    // 🟢 REVERTED IMAGE GALLERY LOGIC 🟢
    function setupImageGallery() {
        const mainImage = document.getElementById('product-main-image');
        const thumbnails = document.querySelectorAll('#product-thumbnails .thumb-img');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                // Change the main image source
                mainImage.src = e.target.src;

                // Update 'selected' class
                thumbnails.forEach(i => i.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });
    }

    // This function manages everything else
    function setupProductInteractions() {
        
        // --- Description Collapse Logic ---
        const descriptionContainer = document.getElementById('product-description-container');
        const colorSelector = document.getElementById('color-selector'); 

        if (colorSelector && descriptionContainer) {
            const collapseDescription = () => {
                descriptionContainer.classList.add('collapsed');
            }
            
            colorSelector.addEventListener('click', (event) => {
                if (event.target.closest('.color-option')) {
                    collapseDescription();
                }
            });

            descriptionContainer.addEventListener('click', () => {
                descriptionContainer.classList.remove('collapsed');
            });
        }
        
        // --- Color selection (REVERTED LOGIC) ---
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                
                // Directly change the main image source to the color image
                const mainImage = document.getElementById('product-main-image');
                if (mainImage) {
                    mainImage.src = opt.dataset.img; 
                }
            });
        });

        // --- Size selection (Existing Logic) ---
        const sizeButtons = document.querySelectorAll('.size-button');
        if (sizeButtons.length > 0) {
            sizeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    sizeButtons.forEach(b => b.classList.remove('selected'));
                    button.classList.add('selected');

                    selectedSize = button.dataset.size;
                    currentPrice = Number(button.dataset.price);

                    document.getElementById('product-price').textContent = `${p.currency} ${currentPrice.toLocaleString()}`;
                });
            });
        }
        // 🟢 Model selection logic 🟢
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                selectedModel = e.target.value;
                console.log('Selected Model:', selectedModel);
            });
        }

        // --- Add to Cart (Existing Logic) ---
        document.getElementById('add-cart').addEventListener('click', () => {
            const qty = Number(document.getElementById('qty').value || 1);
            const colorEl = document.querySelector('.color-option.selected');
            const color = colorEl ? colorEl.dataset.name : 'Default';
            const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');

            // Determine which image URL to use for the cart item
            // Since we reverted, we assume the main image is the cart image
            const mainImageUrl = document.getElementById('product-main-image')?.src || p.images[0];


            cart.push({
                id: p.id,
                title: p.title,
                price: currentPrice,
                currency: p.currency,
                qty,
                color,
                size: selectedSize || 'Standard',
                model: selectedModel || 'Standard',
                img: mainImageUrl
            });

            localStorage.setItem('de_cart', JSON.stringify(cart));
            alert('Added to cart');
            
            const badge = document.getElementById('cart-count');
            if (badge) badge.textContent = cart.length;
        });
    }

    // 🟢 FINAL STEP: Call the functions
    setupImageGallery();
    setupProductInteractions();

})();
