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
    // 5. Build and Render the Product Page HTML (Swiper Structure Remains)
    // ***********************************************
    container.innerHTML = `
        <div class="product-page-card">
            
            <div class="product-slideshow">
                
                <div id="product-main-swiper" class="swiper">
                    <div class="swiper-wrapper">
                        ${p.images.map((im, idx) => `
                            <div class="swiper-slide product-main-image-wrapper" data-index="${idx}">
                                <img src="${im}" 
                                     alt="${p.title}" 
                                     onerror="this.onerror=null;this.src='images/placeholder.png';"/>
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                </div>

                <div id="product-thumb-swiper" class="swiper product-thumbs">
                    <div class="swiper-wrapper">
                        ${p.images.map((im, idx) => `
                            <div class="swiper-slide">
                                <img data-index="${idx}" src="${im}" class="thumb-img ${idx === 0 ? 'selected' : ''}" />
                            </div>
                        `).join('')}
                    </div>
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
    
    // 🟢 UPDATED FUNCTION: Initialize Swiper only on Mobile 🟢
    let mainSwiper = null; // Declare swiper instances globally so setupProductInteractions can access them
    let thumbsSwiper = null;

    function initializeSwipers() {
        // Use a 768px breakpoint for mobile vs desktop
        const isMobile = window.innerWidth < 768; 

        if (isMobile) {
            // --- MOBILE: INITIALIZE SWIPER ---
            thumbsSwiper = new Swiper('#product-thumb-swiper', {
                spaceBetween: 10,
                slidesPerView: 4,
                freeMode: true,
                watchSlidesProgress: true,
            });

            mainSwiper = new Swiper('#product-main-swiper', {
                spaceBetween: 10,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
                thumbs: {
                    swiper: thumbsSwiper, 
                },
                touchEventsTarget: 'wrapper',
                longSwipes: true, 
            });
            
            // Sync Thumbnail selection with main swipe action (MOBILE ONLY)
            mainSwiper.on('slideChange', function() {
                const activeIndex = this.activeIndex;
                document.querySelectorAll('.thumb-img').forEach(i => i.classList.remove('selected'));
                
                const activeThumb = document.querySelector(`.thumb-img[data-index="${activeIndex}"]`);
                if (activeThumb) {
                    activeThumb.classList.add('selected');
                    thumbsSwiper.slideTo(activeIndex);
                }
            });

        } else {
            // --- DESKTOP: STATIC DISPLAY LOGIC ---

            // 1. Manually hide all main slides except the first one (since Swiper isn't doing it)
            document.querySelectorAll('.product-main-image-wrapper').forEach((w, idx) => {
                w.style.display = (idx === 0) ? 'block' : 'none';
            });
            
            // 2. Hide the pagination dots on desktop
            const pagination = document.querySelector('.swiper-pagination');
            if (pagination) {
                pagination.style.display = 'none';
            }
        }

        // --- COMMON THUMBNAIL CLICK HANDLER (Works for both Mobile Swiper and Desktop Static) ---
        document.querySelectorAll('.thumb-img').forEach(img => {
            img.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                
                // Update the selected class on thumbnails
                document.querySelectorAll('.thumb-img').forEach(i => i.classList.remove('selected'));
                e.target.classList.add('selected');

                if (isMobile && mainSwiper) {
                    // Mobile: Use Swiper's slideTo method
                    mainSwiper.slideTo(index);
                } else {
                    // Desktop: Manually toggle the main image display
                    document.querySelectorAll('.product-main-image-wrapper').forEach((w, idx) => {
                        w.style.display = (idx === index) ? 'block' : 'none';
                    });
                }
            });
        });
    }


    // This function manages everything else that's not related to swiping
    function setupProductInteractions() {
        
        // --- Description Collapse Logic (Your new feature) ---
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
        
        // --- Color selection (UPDATED LOGIC) ---
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                
                // Get the image source of the selected color option
                const newImgSrc = opt.dataset.img;

                if (mainSwiper) {
                    // MOBILE (Swiper is active): Replace the image source of the CURRENT active slide.
                    // NOTE: This assumes color images are not part of the main gallery array (p.images).
                    const activeSlideImg = mainSwiper.slides[mainSwiper.activeIndex].querySelector('img');
                    if (activeSlideImg) {
                        activeSlideImg.src = newImgSrc; 
                    }
                } else {
                    // DESKTOP (Static Image): Replace the image source of the CURRENTLY VISIBLE slide.
                    const visibleSlideImg = document.querySelector('.product-main-image-wrapper:not([style*="display: none"]) img');
                    if (visibleSlideImg) {
                        visibleSlideImg.src = newImgSrc; 
                    }
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

            cart.push({
                id: p.id,
                title: p.title,
                price: currentPrice,
                currency: p.currency,
                qty,
                color,
                size: selectedSize || 'Standard',
                model: selectedModel || 'Standard',
                img: p.images[0] 
            });

            localStorage.setItem('de_cart', JSON.stringify(cart));
            alert('Added to cart');
            
            const badge = document.getElementById('cart-count');
            if (badge) badge.textContent = cart.length;
        });
    }

    // 🟢 FINAL STEP: Call the functions after all HTML has been injected 🟢
    setupProductInteractions();
    initializeSwipers(); // Must be called after the HTML is rendered

})();
