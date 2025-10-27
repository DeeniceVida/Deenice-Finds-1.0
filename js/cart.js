// --- Global Cart Logic ---
// Use a function to manage data retrieval and saving
function getCart() {
    return JSON.parse(localStorage.getItem('de_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('de_cart', JSON.stringify(cart));
}

// 🟢 NEW: Item Removal Function 🟢
function removeItemFromCart(itemTitle) {
    let cart = getCart();

    // Find the index of the first item with the matching title
    const indexToRemove = cart.findIndex(item => item.title === itemTitle);

    if (indexToRemove > -1) {
        // Remove only that item from the array
        cart.splice(indexToRemove, 1);
        saveCart(cart);
        renderCart(); // Re-render the cart immediately
    }
}

// --- Cart Renderer (Extracted into a function for re-use) ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const cart = getCart();

    // Find the existing form container by its first input element
    const existingForm = document.getElementById('user-name') ? document.getElementById('user-name').closest('div') : null;

    if (!list) return;

    // Apply basic mobile layout styles
    document.body.style.padding = '16px';
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';

    if (cart.length === 0) {
        list.innerHTML = '<p>Your cart is empty.</p>';
        if (btn) btn.style.display = 'none';
        
        // 🟢 FIX 1: Hide the form when the cart is empty 🟢
        if (existingForm) {
            existingForm.style.display = 'none';
        }
        return;
    }

    // Build the cart HTML
    let html = `
        <ul style="list-style:none;padding:0;margin:0;">
          ${cart.map(it => `
            <li class="cart-item" data-product-title="${it.title}" style="
              display:flex;
              align-items:center;
              gap:12px;
              padding:12px 0;
              border-bottom:1px solid #eee;
            ">
              <img src="${it.img || 'https://via.placeholder.com/60'}" alt="${it.title}" 
                style="width:60px;height:60px;object-fit:cover;border-radius:8px;" />
              <div style="flex:1;">
                <strong>${it.title}</strong><br>
                <small>${it.color || ''}</small><br>
                <span>${it.qty} × ${it.price.toLocaleString()} ${it.currency}</span>
              </div>
              <button class="remove-from-cart-btn" data-item-title="${it.title}" style="
                background-color:#dc3545; /* Red for removal */
                color:white;
                border:none;
                padding:5px 10px;
                border-radius:4px;
                cursor:pointer;
                font-size:0.8em;
                margin-left:10px;
                flex-shrink:0;
              ">
                Remove
              </button>
            </li>
          `).join('')}
        </ul>
    `;

    list.innerHTML = html;
    if (btn) btn.style.display = 'block';

    // 🟢 NEW: Ensure the form is visible when the cart is NOT empty 🟢
    if (existingForm) {
        existingForm.style.display = 'block';
    }


    // 🟢 FIX 2: Prevent the form from being inserted multiple times 🟢
    // Only insert the form if it doesn't already exist in the DOM
    if (!existingForm) {
        const form = document.createElement('div');
        form.innerHTML = `
          <h3>Your Details</h3>
          <label>Name:<br><input id="user-name" type="text" placeholder="Your name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
          <label>City:<br><input id="user-city" type="text" placeholder="Your city" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
        `;
        list.insertAdjacentElement('afterend', form);
    }
    
    // --- Attach Event Listeners to the Remove Buttons (Same as before) ---
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove ${titleToRemove} from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });

    // 1. --- NEW: Accurate Wells Fargo Delivery Data ---
// All rates are consolidated here, using the BRANCHES as the name and TOTAL as the fee (in KES).
// Nairobi is explicitly included to cover its own branch pickup.
const DELIVERY_ZONES = [
    // Nairobi and Environs/Manual Option (Must be the first option for logic below)
    { name: "Nairobi and Environs (Manual Entry)", fee: 360, type: 'manual' }, 
    
    // Rift Valley Routes
    { name: "Baraton", fee: 700, type: 'suggested' },
    { name: "Bungoma", fee: 600, type: 'suggested' },
    { name: "Burnt Forest", fee: 520, type: 'suggested' },
    { name: "Chewele", fee: 600, type: 'suggested' },
    { name: "Eldama Ravine", fee: 470, type: 'suggested' },
    { name: "Eldoret", fee: 450, type: 'suggested' },
    { name: "Engineer", fee: 400, type: 'suggested' },
    { name: "Gilgil", fee: 350, type: 'suggested' },
    { name: "Iten", fee: 450, type: 'suggested' },
    { name: "Kabarnet", fee: 580, type: 'suggested' },
    { name: "Kapenguria", fee: 780, type: 'suggested' },
    { name: "Kapsabet", fee: 620, type: 'suggested' },
    { name: "Kijabe", fee: 350, type: 'suggested' },
    { name: "Kimilili", fee: 600, type: 'suggested' },
    { name: "Kitale", fee: 520, type: 'suggested' },
    { name: "Limuru", fee: 350, type: 'suggested' },
    { name: "Lodwar", fee: 2050, type: 'suggested' }, // *Starred on list
    { name: "Lokichogio", fee: 2850, type: 'suggested' }, // *Starred on list
    { name: "Lugari", fee: 600, type: 'suggested' },
    { name: "Malaba", fee: 600, type: 'suggested' },
    { name: "Maralal", fee: 1100, type: 'suggested' },
    { name: "Moi’s Bridge", fee: 530, type: 'suggested' },
    { name: "Molo", fee: 480, type: 'suggested' },
    { name: "Mumias", fee: 600, type: 'suggested' },
    { name: "Naivasha", fee: 350, type: 'suggested' },
    { name: "Nakuru", fee: 360, type: 'suggested' },
    { name: "Nandi Hills", fee: 400, type: 'suggested' },
    { name: "Narok", fee: 420, type: 'suggested' },
    { name: "Njro", fee: 480, type: 'suggested' },
    { name: "Nyahururu", fee: 480, type: 'suggested' },
    { name: "Nzoia", fee: 710, type: 'suggested' },
    { name: "Olkalau", fee: 480, type: 'suggested' },
    { name: "Rumuruti", fee: 500, type: 'suggested' },
    { name: "Salgaa", fee: 680, type: 'suggested' },
    { name: "Turbo", fee: 450, type: 'suggested' },
    { name: "Webuye", fee: 600, type: 'suggested' },

    // Lake Routes
    { name: "Ahero", fee: 640, type: 'suggested' },
    { name: "Awendo", fee: 600, type: 'suggested' },
    { name: "Bomet", fee: 500, type: 'suggested' },
    { name: "Bondo", fee: 640, type: 'suggested' },
    { name: "Busia", fee: 590, type: 'suggested' },
    { name: "Homa Bay", fee: 700, type: 'suggested' },
    { name: "Isebania", fee: 740, type: 'suggested' },
    { name: "Kakamega", fee: 480, type: 'suggested' },
    { name: "Katenchaha", fee: 740, type: 'suggested' },
    { name: "Kendubay", fee: 750, type: 'suggested' },
    { name: "Kericho", fee: 480, type: 'suggested' },
    { name: "Keroka", fee: 600, type: 'suggested' },
    { name: "Kligoris", fee: 600, type: 'suggested' },
    { name: "Kisii", fee: 500, type: 'suggested' },
    { name: "Kisumu", fee: 500, type: 'suggested' },
    { name: "Litein", fee: 500, type: 'suggested' },
    { name: "Londiani", fee: 500, type: 'suggested' },
    { name: "Luanda", fee: 660, type: 'suggested' },
    { name: "Maseno", fee: 500, type: 'suggested' },
    { name: "Mbale", fee: 480, type: 'suggested' },
    { name: "Mbita", fee: 720, type: 'suggested' },
    { name: "Migori", fee: 600, type: 'suggested' },
    { name: "Muhoroni", fee: 660, type: 'suggested' },
    { name: "Nambale", fee: 670, type: 'suggested' },
    { name: "Nyabondo", fee: 500, type: 'suggested' },
    { name: "Ogendo", fee: 600, type: 'suggested' },
    { name: "Oyugis", fee: 600, type: 'suggested' },
    { name: "Obarogo", fee: 600, type: 'suggested' },
    { name: "Rongo", fee: 600, type: 'suggested' },
    { name: "Sabatia", fee: 480, type: 'suggested' },
    { name: "Siaya", fee: 650, type: 'suggested' },
    { name: "Sotik", fee: 500, type: 'suggested' },
    { name: "Ugunga", fee: 650, type: 'suggested' },
    
    // Mt Kenya Routes
    { name: "Chogoria", fee: 480, type: 'suggested' },
    { name: "Chuka", fee: 420, type: 'suggested' },
    { name: "Embu", fee: 420, type: 'suggested' },
    { name: "Isiolo", fee: 650, type: 'suggested' },
    { name: "Juja", fee: 380, type: 'suggested' },
    { name: "Kagio", fee: 400, type: 'suggested' },
    { name: "Kangari", fee: 350, type: 'suggested' },
    { name: "Kangema", fee: 420, type: 'suggested' },
    { name: "Karatina", fee: 400, type: 'suggested' },
    { name: "Kerugoya", fee: 400, type: 'suggested' },
    { name: "Kiganjo", fee: 410, type: 'suggested' },
    { name: "Kutus", fee: 410, type: 'suggested' },
    { name: "Makutano", fee: 460, type: 'suggested' },
    { name: "Makuyu", fee: 360, type: 'suggested' },
    { name: "Marsabit", fee: 950, type: 'suggested' },
    { name: "Maua", fee: 650, type: 'suggested' },
    { name: "Meru", fee: 480, type: 'suggested' },
    { name: "Moyale", fee: 3050, type: 'suggested' },
    { name: "Mukuweini", fee: 410, type: 'suggested' },
    { name: "Murang’a", fee: 420, type: 'suggested' },
    { name: "Mwea", fee: 410, type: 'suggested' },
    { name: "Mwingi", fee: 550, type: 'suggested' },
    { name: "Nanyuki", fee: 520, type: 'suggested' },
    { name: "Naromoru", fee: 520, type: 'suggested' },
    { name: "Nkubu", fee: 460, type: 'suggested' },
    { name: "Nyeri", fee: 420, type: 'suggested' },
    { name: "Othaya", fee: 420, type: 'suggested' },
    { name: "Ruiru", fee: 360, type: 'suggested' },
    { name: "Runyenjes", fee: 420, type: 'suggested' },
    { name: "Sabasaba", fee: 360, type: 'suggested' },
    { name: "Sagana", fee: 480, type: 'suggested' },
    { name: "Thika", fee: 360, type: 'suggested' },
    { name: "Timau", fee: 520, type: 'suggested' },

    // Coastal Routes
    { name: "Diani", fee: 770, type: 'suggested' },
    { name: "Garsen", fee: 1400, type: 'suggested' },
    { name: "Kilifi", fee: 800, type: 'suggested' },
    { name: "Lamu", fee: 2050, type: 'suggested' },
    { name: "Malindi", fee: 840, type: 'suggested' },
    { name: "Mariakani", fee: 640, type: 'suggested' },
    { name: "Mombasa", fee: 640, type: 'suggested' },
    { name: "Mpeketoni", fee: 2050, type: 'suggested' },
    { name: "Mtwapa", fee: 640, type: 'suggested' },
    { name: "Mwatate", fee: 840, type: 'suggested' },
    { name: "Sultan Hamud", fee: 580, type: 'suggested' },
    { name: "Taveta", fee: 850, type: 'suggested' }, // *Starred on list
    { name: "Voi", fee: 600, type: 'suggested' },
    { name: "Watamu", fee: 850, type: 'suggested' },
    { name: "Wundanyi", fee: 800, type: 'suggested' },

    // Outer Nairobi Routes (Nairobi Branch is 690, but Kitengela/Athi River/Ruiru are cheaper)
    { name: "Athi River", fee: 360, type: 'suggested' },
    { name: "Emali", fee: 580, type: 'suggested' },
    { name: "Garissa", fee: 750, type: 'suggested' },
    { name: "Isinya", fee: 420, type: 'suggested' },
    { name: "Kajiado", fee: 420, type: 'suggested' },
    { name: "Kangundo", fee: 400, type: 'suggested' },
    { name: "Kibwezi", fee: 580, type: 'suggested' },
    { name: "Kitengela", fee: 360, type: 'suggested' },
    { name: "Kitui", fee: 450, type: 'suggested' },
    { name: "Machakos", fee: 420, type: 'suggested' },
    { name: "Makindu", fee: 580, type: 'suggested' },
    { name: "Masii", fee: 500, type: 'suggested' },
    { name: "Mtito Andei", fee: 600, type: 'suggested' },
    { name: "Mutomo", fee: 600, type: 'suggested' },
    { name: "Mwala", fee: 600, type: 'suggested' },
    { name: "Namanga", fee: 670, type: 'suggested' },
    { name: "Oloitoktok", fee: 670, type: 'suggested' },
    { name: "Tala", fee: 420, type: 'suggested' },
    { name: "Wote", fee: 600, type: 'suggested' },
    
    // Add the specific Nairobi branch rate for those picking up there
    { name: "Nairobi (Branch Pickup)", fee: 690, type: 'suggested' }
];

// --- Global Cart Logic ---
function getCart() {
    return JSON.parse(localStorage.getItem('de_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('de_cart', JSON.stringify(cart));
}

function removeItemFromCart(itemTitle) {
    let cart = getCart();

    const indexToRemove = cart.findIndex(item => item.title === itemTitle);

    if (indexToRemove > -1) {
        cart.splice(indexToRemove, 1);
        saveCart(cart);
        renderCart(); 
    }
}

// 🟢 Function to get the current delivery fee
function getCurrentDeliveryFee() {
    // Check if the fee is already stored in localStorage (optional but good practice)
    const storedFee = parseInt(localStorage.getItem('de_delivery_fee') || '0');
    if (storedFee > 0) return storedFee;

    // Fallback to checking the DOM if localStorage isn't used
    const feeDisplay = document.getElementById('delivery-fee-amount');
    if (!feeDisplay || feeDisplay.textContent === 'TBD') return 0;
    
    const feeText = feeDisplay.textContent.replace('KES', '').replace(/,/g, '').trim();
    return parseInt(feeText) || 0;
}


// --- Cart Renderer ---
function renderCart() {
    const list = document.getElementById('cart-contents');
    const btn = document.getElementById('cart-send');
    const summary = document.getElementById('cart-summary');
    const cart = getCart();

    const existingFormContainer = document.getElementById('user-details-form');

    if (!list) return;

    // Apply basic mobile layout styles
    document.body.style.padding = '16px';
    document.body.style.maxWidth = '700px';
    document.body.style.margin = '0 auto';

    if (cart.length === 0) {
        list.innerHTML = '<p>Your cart is empty. <a href="index.html">Start shopping!</a></p>';
        if (btn) btn.style.display = 'none';
        if (summary) summary.innerHTML = '';
        if (existingFormContainer) existingFormContainer.style.display = 'none';
        return;
    }

    // Calculate Subtotal
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const currency = cart[0]?.currency || 'KES';
    
    // Get fee, which will be 0 initially or the stored value
    const deliveryFee = getCurrentDeliveryFee();
    const grandTotal = subtotal + deliveryFee;

    // 2. Build the cart HTML
    let cartHtml = `
        <ul style="list-style:none;padding:0;margin:0;">
          ${cart.map(it => `
            <li class="cart-item" data-product-title="${it.title}" style="
              display:flex;
              align-items:center;
              gap:12px;
              padding:12px 0;
              border-bottom:1px solid #eee;
            ">
              <img src="${it.img || 'https://via.placeholder.com/60'}" alt="${it.title}" 
                style="width:60px;height:60px;object-fit:cover;border-radius:8px;" />
              <div style="flex:1;">
                <strong>${it.title}</strong><br>
                <small>${it.color || ''}</small><br>
                <span>${it.qty} × ${it.price.toLocaleString()} ${it.currency}</span>
              </div>
              <button class="remove-from-cart-btn" data-item-title="${it.title}" style="
                background-color:#dc3545;
                color:white;
                border:none;
                padding:5px 10px;
                border-radius:4px;
                cursor:pointer;
                font-size:0.8em;
                margin-left:10px;
                flex-shrink:0;
              ">
                Remove
              </button>
            </li>
          `).join('')}
        </ul>
    `;

    list.innerHTML = cartHtml;
    if (btn) btn.style.display = 'block';

    // 3. Build and manage the form container
    const nairobiManualOption = DELIVERY_ZONES.find(z => z.type === 'manual');
    const nairobiFee = nairobiManualOption ? nairobiManualOption.fee : 400; // Fallback fee

    if (!existingFormContainer) {
        const form = document.createElement('div');
        form.id = 'user-details-form';
        form.innerHTML = `
          <h3>Your Details & Delivery</h3>
          <label>Name:<br><input id="user-name" type="text" placeholder="Your full name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
          
            <label>Delivery Town/City:
                <span style="font-size:0.8em;display:block;margin-bottom:4px;color:#555;">(Select a branch or type your town. Nairobi & Environs is **KES ${nairobiFee}**)</span>
            <input id="user-city" list="city-suggestions-list" type="text" placeholder="E.g., Mombasa, Nakuru, Nairobi" required style="width:100%;padding:8px;margin-bottom:4px;" />
            </label>
            <datalist id="city-suggestions-list">
                ${DELIVERY_ZONES.map(z => 
                    // Use a slightly cleaner label for the manual option in the list
                    `<option value="${z.name.replace(' (Manual Entry)', '')}" data-fee="${z.fee}" data-type="${z.type}">`
                ).join('')}
            </datalist>

            <div id="city-feedback" style="margin-bottom:15px;padding:8px;border-radius:4px;background-color:#f0f8ff;">
                Delivery Fee: <strong id="delivery-fee-amount">TBD</strong>
            </div>
        `;
        list.insertAdjacentElement('afterend', form);
    } else {
        existingFormContainer.style.display = 'block';
    }
    
    // 4. Attach Town/City Suggestion Logic
    const currentCityInput = document.getElementById('user-city');
    if (currentCityInput) {
        // Use a flag or check to ensure event listeners are only added once
        if (!currentCityInput.dataset.listenersAdded) {
            currentCityInput.addEventListener('input', handleCityInput);
            currentCityInput.dataset.listenersAdded = 'true';
        }
        
        // Ensure the current fee is displayed if one was previously selected/stored
        const feeDisplay = document.getElementById('delivery-fee-amount');
        if (deliveryFee > 0) {
            feeDisplay.textContent = `KES ${deliveryFee.toLocaleString('en-US')}`;
        } else {
             // Set the initial message for Nairobi/Manual if TBD
             feedbackDiv.innerHTML = `Delivery Fee: <strong id="delivery-fee-amount">TBD</strong>. Enter a town from the list, or type a town in the **Nairobi & Environs** area for **KES ${nairobiFee}** delivery.`;
        }
    }
    
    // 5. Update Summary 
    updateSummary(subtotal, currency, deliveryFee, grandTotal);


    // --- Attach Event Listeners to the Remove Buttons ---
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const titleToRemove = e.currentTarget.getAttribute('data-item-title');
            if (confirm(`Are you sure you want to remove ${titleToRemove} from your cart?`)) {
                removeItemFromCart(titleToRemove);
            }
        });
    });

    // --- WhatsApp Button Logic ---
    if (btn) {
        // Use a flag or check to ensure event listeners are only added once
        if (!btn.dataset.listenersAdded) {
            btn.addEventListener('click', sendOrder);
            btn.dataset.listenersAdded = 'true';
        }
    }
}

// 🟢 Handles City Input for Suggestions and Fee Calculation
function handleCityInput(e) {
    const input = e.target.value.trim();
    const feeDisplay = document.getElementById('delivery-fee-amount');
    const feedbackDiv = document.getElementById('city-feedback');
    const cart = getCart();
    
    const nairobiManualOption = DELIVERY_ZONES.find(z => z.type === 'manual');
    const nairobiFee = nairobiManualOption ? nairobiManualOption.fee : 400;

    // Use the datalist options to check for matches (case-insensitive)
    const matchedZone = DELIVERY_ZONES.find(z => z.name.toLowerCase().replace(' (manual entry)', '') === input.toLowerCase());
    
    let fee = 0;
    let cityForDisplay = input;
    let feedbackColor = '#f0f8ff';
    let feedbackText = 'Delivery Fee: <strong id="delivery-fee-amount">TBD</strong>';

    if (matchedZone) {
        // 2a. Perfect Match Found (either a suggested town or the Nairobi option)
        fee = matchedZone.fee;
        cityForDisplay = matchedZone.name.replace(' (Manual Entry)', '');
        feedbackColor = '#d4edda'; // Light green for success
        feedbackText = `Delivery Fee for **${cityForDisplay}**: <strong id="delivery-fee-amount">KES ${fee.toLocaleString('en-US')}</strong>`;
        
    } else if (input.toLowerCase().includes('nairobi') || input.toLowerCase().includes('environs')) {
        // 2b. Manual Entry that suggests Nairobi/Environs
        fee = nairobiFee;
        feedbackColor = '#fff3cd'; // Light yellow for caution/manual confirmation
        feedbackText = `Delivery Fee (Manual/Environs): <strong id="delivery-fee-amount">KES ${fee.toLocaleString('en-US')}</strong>. Please ensure your town is within Nairobi & Environs.`;

    } else if (input.length > 0) {
        // 2c. No match and user has typed something
        feedbackColor = '#f8d7da'; // Light red for not found
        feedbackText = `Delivery Fee: <strong id="delivery-fee-amount">TBD</strong>. Town not in Wells Fargo list. For Nairobi & Environs, delivery is **KES ${nairobiFee}**.`;
    }
    
    // Update DOM and local storage
    feeDisplay.textContent = fee.toLocaleString('en-US') === '0' ? 'TBD' : `KES ${fee.toLocaleString('en-US')}`;
    feedbackDiv.style.backgroundColor = feedbackColor;
    feedbackDiv.innerHTML = feedbackText;
    localStorage.setItem('de_delivery_fee', fee.toString());

    // Re-render to update the Grand Total
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const currency = cart[0]?.currency || 'KES';
    updateSummary(subtotal, currency, fee, subtotal + fee);
}


// 🟢 Function to render the total summary
function updateSummary(subtotal, currency, deliveryFee, grandTotal) {
    const summary = document.getElementById('cart-summary');
    if (!summary) return;

    summary.innerHTML = `
        <div style="margin-top:20px;padding-top:10px;border-top:2px solid #333;">
            <p style="display:flex;justify-content:space-between;">Subtotal: <span>${subtotal.toLocaleString()} ${currency}</span></p>
            <p style="display:flex;justify-content:space-between;">Delivery Fee: <span>${deliveryFee.toLocaleString()} ${currency}</span></p>
            <h4 style="display:flex;justify-content:space-between;margin-top:10px;">Grand Total: <span>${grandTotal.toLocaleString()} ${currency}</span></h4>
        </div>
    `;
}


// 🟢 Separate Function for Order Sending
function sendOrder() {
    const cart = getCart();
    const nameInput = document.getElementById('user-name');
    const cityInput = document.getElementById('user-city');

    if (!nameInput || !cityInput) {
        alert('Internal error: Missing form inputs.');
        return;
    }

    const name = nameInput.value.trim();
    const city = cityInput.value.trim();
    const deliveryFee = getCurrentDeliveryFee();

    if (!name || !city || deliveryFee === 0) {
        alert('🚨 Please ensure you enter your name, select or type a delivery town, and the delivery fee is calculated.');
        return;
    }

    const cfg = window.DEENICE_CONFIG;
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const grandTotal = subtotal + deliveryFee;

    const txt = encodeURIComponent(
        `🛍 *New Order from Deenice Finds* (Wells Fargo Rates)\n\n👤 Name: ${name}\n🏙 Delivery Town: ${city}\n💰 Delivery Fee: KES ${deliveryFee.toLocaleString()}\n\n📦 Items:\n` +
        cart.map(i =>
            `- ${i.title} x${i.qty} (${i.color || 'Default'}) - ${i.price.toLocaleString()}${i.currency}`
        ).join('\n') +
        `\n\nSubtotal: ${subtotal.toLocaleString()} KES` +
        `\n🚚 **Grand Total (Incl. Delivery):** ${grandTotal.toLocaleString()} KES`
    );

    window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`, '_blank');
}

    // --- WhatsApp Button Logic (Original Logic - remains the same, just better placed) ---
    if (btn) {
      btn.addEventListener('click', () => {
        const name = document.getElementById('user-name').value.trim();
        const city = document.getElementById('user-city').value.trim();
        // ... (rest of the WhatsApp logic) ...
        
        // ... (WhatsApp logic continues) ...
        if (!name || !city) {
          alert('Please enter your name and city before sending your order.');
          return;
        }

        const cfg = window.DEENICE_CONFIG;
        const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

        const txt = encodeURIComponent(
          `🛍 *New Order from Deenice Finds*\n\n👤 Name: ${name}\n🏙 City: ${city}\n\n📦 Items:\n` +
          cart.map(i =>
            `- ${i.title} x${i.qty} (${i.color || 'Default'}) - ${i.price.toLocaleString()}${i.currency}`
          ).join('\n') +
          `\n\nTotal: ${total.toLocaleString()} ${cart[0]?.currency || 'KES'}`
        );

        window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`, '_blank');
      });
    }
}
// Ensure the rendering starts when the page is fully loaded
document.addEventListener('DOMContentLoaded', renderCart);
