// --- 1. ACCURATE WELLS FARGO DELIVERY DATA (OUTSIDE NAIROBI) ---
const DELIVERY_ZONES = [
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
    { name: "Lodwar", fee: 2050, type: 'suggested' },
    { name: "Lokichogio", fee: 2850, type: 'suggested' },
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
    { name: "Taveta", fee: 850, type: 'suggested' },
    { name: "Voi", fee: 600, type: 'suggested' },
    { name: "Watamu", fee: 850, type: 'suggested' },
    { name: "Wundanyi", fee: 800, type: 'suggested' },

    // Outer Nairobi Routes (Wells Fargo Branches)
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
    
    // Nairobi Branch/Pickup
    { name: "Nairobi (Branch Pickup)", fee: 690, type: 'suggested' }
];

// --- 2. NAIROBI AND ENVIRONS DISTANCE DATA (Distance from CBD/GPO) ---
// Fee: Distance (km) * KES 60. Minimum fee is 360 KES.
const NAIROBI_DISTANCES = [
    { name: "Westlands", distance: 5 }, 
    { name: "Upper Hill", distance: 4 }, 
    { name: "Kilimani", distance: 7 }, 
    { name: "Lavington", distance: 10 }, 
    { name: "Karen", distance: 18 }, 
    { name: "Lang'ata", distance: 11 }, 
    { name: "Embakasi", distance: 15 }, 
    { name: "Roysambu", distance: 11 }, 
    { name: "Kasarani", distance: 14 }, 
    { name: "Rongai", distance: 20 }, 
    { name: "Syokimau", distance: 22 }, 
    { name: "Mlolongo", distance: 25 }, 
    { name: "South C", distance: 6 }, 
    { name: "South B", distance: 5 }, 
    { name: "Donholm", distance: 9 }, 
    { name: "Buruburu", distance: 8 }, 
    { name: "Nairobi and Environs (Flat Rate)", distance: 6 } 
];
const MINIMUM_NAIROBI_FEE = 360; 
const DELIVERY_RATE_PER_KM = 60;

// 🟢 NEW CONSTANT FOR APPLE FEE 🟢
const APPLE_PICKUP_FEE_USD = 65.00; 

// --- 3. DELIVERY FEE LOGIC ---

function getDeliveryFee(town) {
    const cleanedTown = town.toLowerCase().trim();
    
    // 1. Check Nairobi Distance Logic
    const matchedNairobiZone = NAIROBI_DISTANCES.find(z => cleanedTown.includes(z.name.toLowerCase()));
    
    if (matchedNairobiZone) {
        let fee = Math.round(matchedNairobiZone.distance * DELIVERY_RATE_PER_KM); 
        return Math.max(fee, MINIMUM_NAIROBI_FEE);
    }

    // 2. Check Wells Fargo Long-Distance Logic
    const matchedLongDistanceZone = DELIVERY_ZONES.find(z => z.name.toLowerCase().replace(' (branch pickup)', '') === cleanedTown);
    if (matchedLongDistanceZone) {
        return matchedLongDistanceZone.fee;
    }

    // 3. Fallback
    return 0;
}

function updateCityFeedback(town) {
    const feedbackDiv = document.getElementById('bfm-city-feedback');
    const townInput = document.getElementById('bfm-town');
    if (!feedbackDiv || !townInput) return;

    const townFee = getDeliveryFee(town);
    
    const matchedNairobiZone = NAIROBI_DISTANCES.find(z => town.toLowerCase().trim().includes(z.name.toLowerCase()));
    const isNairobiDistanceZone = !!matchedNairobiZone;
    
    feedbackDiv.style.padding = '8px';
    feedbackDiv.style.borderRadius = '4px';

    if (townFee > 0) {
        let feeType = "Exact Branch Fee";
        let feedbackColor = '#d4edda'; 
        
        if (isNairobiDistanceZone) {
            feeType = `Nairobi Doorstep (Approx. ${matchedNairobiZone.distance}km @ KES ${DELIVERY_RATE_PER_KM}/km)`;
            feedbackColor = '#fff3cd'; 
        } else if (townFee === MINIMUM_NAIROBI_FEE) {
            feeType = `Nairobi Environs Flat Fee (Min)`;
        }

        feedbackDiv.style.backgroundColor = feedbackColor;
        feedbackDiv.innerHTML = `**Delivery Fee for ${town}:** ${townFee.toLocaleString()} KES (${feeType})`;
        
    } else {
        feedbackDiv.style.backgroundColor = '#f0f8ff'; 
        feedbackDiv.innerHTML = `**Delivery Fee:** TBD. Type your town for suggestion, or select a Wells Fargo branch. Minimum Nairobi doorstep fee: **${MINIMUM_NAIROBI_FEE.toLocaleString()} KES**`;
    }
}


// --- 4. MAIN CALCULATOR LOGIC (Updated to pull ALL towns for suggestions) ---

document.addEventListener("DOMContentLoaded", () => {
    const priceInput = document.getElementById("bfm-price");
    const linkInput = document.getElementById("bfm-link");
    const townInput = document.getElementById("bfm-town"); 
    const resultBox = document.getElementById("bfm-results");
    const sendBtn = document.getElementById("bfm-send");

    const USD_TO_KES = 135; 

    // Combine all unique town names for the datalist
    const allTowns = [
        ...NAIROBI_DISTANCES.map(z => z.name),
        ...DELIVERY_ZONES.map(z => z.name)
    ].filter(name => !name.includes('Flat Rate'));

    // Populate datalist dynamically 
    const dataList = document.getElementById('bfm-city-suggestions-list');
    if (dataList) {
        dataList.innerHTML = '';
        allTowns.forEach(name => {
            const option = document.createElement('option');
            option.value = name.replace(' (Branch Pickup)', '').replace(' (Flat Rate)', '').replace(' (Manual Entry)', '');
            dataList.appendChild(option);
        });
    }

    // 🟢 UPDATED CALCULATE TOTAL FUNCTION 🟢
    function calculateTotal(price, link) {
        let shipping, service, appleFee;

        // 1. Calculate Standard Fees
        if (price <= 750) {
            shipping = 20 + 0.035 * price;
            service = 30;
        } else {
            shipping = 20 + 0.035 * price;
            service = 0.045 * price;
        }
        
        // 2. Determine Apple Pick Up Fee
        const isAppleLink = link.toLowerCase().includes('apple.com');
        appleFee = isAppleLink ? APPLE_PICKUP_FEE_USD : 0.00;

        // 3. Calculate Totals
        const totalUSD = price + shipping + service + appleFee;

        // Note: The conversion to KES for the total is done outside this function
        // to clearly separate USD and KES calculations.

        return { shipping, service, appleFee, totalUSD };
    }

    // 🟢 UPDATED UPDATE RESULTS FUNCTION 🟢
    function updateResults() {
        const price = parseFloat(priceInput.value);
        const link = linkInput.value.trim(); // Get link here
        const town = townInput.value.trim(); 
        const deliveryKES = getDeliveryFee(town); 

        if (isNaN(price) || price <= 0) {
            resultBox.innerHTML = `<p style="color:#888;">Enter a valid price to see the total.</p>`;
            updateCityFeedback(town); 
            return;
        }
        
        updateCityFeedback(town);

        const { shipping, service, appleFee, totalUSD } = calculateTotal(price, link); // Pass link
        
        const totalKES = totalUSD * USD_TO_KES;
        const grandTotalKES = totalKES + deliveryKES; 

        // --- Updated appleFeeDisplay (Using a CSS class) ---
const appleFeeDisplay = appleFee > 0 ? 
    `<p class="special-fee-notice"><strong>Apple Pick Up Fee:</strong> $${appleFee.toFixed(2)}</p>` : 
    '';

        resultBox.innerHTML = `
            <div class="quote-box" style="border:1px solid #ccc; padding:15px; border-radius:8px;">
                <p><strong>Item Price:</strong> $${price.toFixed(2)}</p>
                <p><strong>Shipping & Service:</strong> $${(shipping + service).toFixed(2)}</p>
                ${appleFeeDisplay}
                <hr style="margin:10px 0;">
                <p><strong>Total Import Cost (USD):</strong> $${totalUSD.toFixed(2)}</p>
                <p><strong>Import/Buy Total (KES):</strong> ${totalKES.toLocaleString("en-KE", {
                    maximumFractionDigits: 0,
                })} KES</p>
                <p><strong>Delivery Fee (${town || 'TBD'}):</strong> ${deliveryKES.toLocaleString("en-KE", {
                    maximumFractionDigits: 0,
                })} KES</p>
                <hr style="margin:10px 0;">
                <p style="font-size:1.2em; color:#007bff;">
                    <strong>GRAND TOTAL (KES):</strong> 
                    <span style="float:right;">${grandTotalKES.toLocaleString("en-KE", {
                        maximumFractionDigits: 0,
                    })} KES</span>
                </p>
            </div>
        `;
    }

    // Update live as user types (all inputs)
    priceInput.addEventListener("input", updateResults);
    linkInput.addEventListener("input", updateResults); // Re-run calculation on link change
    townInput.addEventListener("input", updateResults); 

    // WhatsApp order (Updated + Product Title Extraction + Progress Tracking)
sendBtn.addEventListener("click", () => {
    const price = parseFloat(priceInput.value);
    const link = linkInput.value.trim();
    const town = townInput.value.trim(); 
    const deliveryKES = getDeliveryFee(town); 

    // Link validation
    if (!link) {
        alert("⚠️ The Product Link is required to place a Buy For Me order. Please paste it in the first field.");
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price.");
        return;
    }

    if (!town || deliveryKES === 0) { 
        alert("🚨 Please enter a delivery town and ensure the delivery fee is calculated before sending the order.");
        return;
    }

    const { appleFee, totalUSD } = calculateTotal(price, link);
    const totalKES = totalUSD * USD_TO_KES;
    const grandTotalKES = totalKES + deliveryKES; 
    const appleFeeText = appleFee > 0 ? ` (+ Apple Fee $${appleFee.toFixed(2)})` : '';

    //
    // ⭐ PRODUCT TITLE EXTRACTION ⭐
    //
    let productTitle = "Buy For Me Product";
    try {
        const domain = new URL(link).hostname;
        productTitle = `Product from ${domain}`;
    } catch (e) {
        productTitle = "Buy For Me Product";
    }

    //
    // ⭐ CREATE ORDER WITH PROGRESS TRACKING ⭐
    //
    const now = new Date().toISOString();

    const orderData = {
        id: 'BFM' + Date.now().toString(36).toUpperCase(),
        orderDate: now,
        status: 'pending',
        statusUpdated: now,
        type: 'buy-for-me',

        progressHistory: [{
            status: 'pending',
            timestamp: now,
            step: progressTracker?.getStepByStatus
                ? progressTracker.getStepByStatus('pending')
                : 'order_received'
        }],

        customer: {
            name: 'Buy For Me Customer',
            city: town,
            phone: 'Provided via WhatsApp'
        },

        items: [{
            title: productTitle,    // ← ADDED
            price: price,
            qty: 1,
            link: link,
            type: 'buy-for-me'
        }],

        totalAmount: grandTotalKES,

        delivery: {
            method: 'delivery',
            city: town,
            fee: deliveryKES
        }
    };

    // Add to order history
    if (window.addOrderToHistory) {
        window.addOrderToHistory(orderData);
        console.log("📦 Buy For Me Order Added:", orderData);
    }

    //
    // ⭐ SEND WHATSAPP MESSAGE ⭐
    //
    const message = encodeURIComponent(
        `🛍 Buy For Me Request (Calculated)\n\n` +
        `🆔 Order ID: ${orderData.id}\n` +
        `🔗 Product Link: ${link}\n` +
        `🛒 Product: ${productTitle}\n` +
        `💵 Item Price: $${price.toFixed(2)}\n` +
        `🚚 Delivery Town: ${town}\n` +
        `📦 Import/Service Total: $${totalUSD.toFixed(2)}${appleFeeText} = ${totalKES.toLocaleString()} KES\n` +
        `💰 Delivery Fee: ${deliveryKES.toLocaleString()} KES\n\n` +
        `🔥 **GRAND TOTAL: ${grandTotalKES.toLocaleString()} KES**\n\nPlease confirm details.`
    );
    
    window.open(`https://wa.me/254106590617?text=${message}`, "_blank");
});

    
    // Initialize results display when page loads
    updateResults();
});
