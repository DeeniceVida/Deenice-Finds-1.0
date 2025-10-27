// --- 1. ACCURATE WELLS FARGO DELIVERY DATA ---
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

    // Outer Nairobi Routes
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

// --- 2. DELIVERY FEE LOGIC ---

function getDeliveryFee(town) {
    const cleanedTown = town.toLowerCase().trim().replace(' (manual entry)', '');
    const nairobiFee = DELIVERY_ZONES.find(z => z.type === 'manual').fee;

    // 1. Check for exact match
    const matchedZone = DELIVERY_ZONES.find(z => z.name.toLowerCase().replace(' (manual entry)', '') === cleanedTown);
    if (matchedZone) {
        return matchedZone.fee;
    }

    // 2. Check for Nairobi/Environs (manual) logic
    if (cleanedTown.includes('nairobi') || cleanedTown.includes('environs')) {
        return nairobiFee;
    }

    // 3. Fallback (no valid town entered)
    return 0;
}

function updateCityFeedback(town) {
    const feedbackDiv = document.getElementById('bfm-city-feedback');
    const townInput = document.getElementById('bfm-town');
    if (!feedbackDiv || !townInput) return;

    const townFee = getDeliveryFee(town);
    const nairobiFee = DELIVERY_ZONES.find(z => z.type === 'manual').fee;
    const cleanedTown = town.toLowerCase().trim().replace(' (manual entry)', '');

    feedbackDiv.style.padding = '8px';
    feedbackDiv.style.borderRadius = '4px';

    if (townFee > 0) {
        if (townFee === nairobiFee && (cleanedTown.includes('nairobi') || cleanedTown.includes('environs'))) {
            // Nairobi/Manual Case
            feedbackDiv.style.backgroundColor = '#fff3cd'; // Light yellow
            feedbackDiv.innerHTML = `**Delivery Fee (Nairobi/Environs):** ${townFee.toLocaleString()} KES`;
        } else {
            // Suggested Town Case
            feedbackDiv.style.backgroundColor = '#d4edda'; // Light green
            feedbackDiv.innerHTML = `**Delivery Fee for ${town}:** ${townFee.toLocaleString()} KES`;
        }
    } else {
        // No Match/TBD Case
        feedbackDiv.style.backgroundColor = '#f0f8ff'; // Light blue
        feedbackDiv.innerHTML = `**Delivery Fee:** TBD. Type your town for suggestion, or select **Nairobi** for **${nairobiFee.toLocaleString()} KES**.`;
    }
}


// --- 3. MAIN CALCULATOR LOGIC (Updated) ---

document.addEventListener("DOMContentLoaded", () => {
    const priceInput = document.getElementById("bfm-price");
    const linkInput = document.getElementById("bfm-link");
    const townInput = document.getElementById("bfm-town"); // NEW: Get town input
    const resultBox = document.getElementById("bfm-results");
    const sendBtn = document.getElementById("bfm-send");

    const USD_TO_KES = 135; // Adjust to your current exchange rate

    // Populate datalist dynamically (for town suggestions)
    const dataList = document.getElementById('bfm-city-suggestions-list');
    if (dataList) {
        dataList.innerHTML = DELIVERY_ZONES.map(z => 
            // Use a cleaner value in the list option
            `<option value="${z.name.replace(' (Manual Entry)', '')}">`
        ).join('');
    }

    function calculateTotal(price) {
        let shipping, service;

        if (price <= 750) {
            shipping = 20 + 0.035 * price;
            service = 30;
        } else {
            shipping = 20 + 0.035 * price;
            service = 0.045 * price;
        }

        const totalUSD = price + shipping + service;
        const totalKES = totalUSD * USD_TO_KES;

        return { shipping, service, totalUSD, totalKES };
    }

    function updateResults() {
        const price = parseFloat(priceInput.value);
        const town = townInput.value.trim(); // NEW: Get current town
        const deliveryKES = getDeliveryFee(town); // NEW: Get delivery fee

        if (isNaN(price) || price <= 0) {
            resultBox.innerHTML = `<p style="color:#888;">Enter a valid price to see the total.</p>`;
            updateCityFeedback(town); // Still show city feedback
            return;
        }
        
        // Update city feedback first
        updateCityFeedback(town);

        const { shipping, service, totalUSD, totalKES } = calculateTotal(price);
        
        const grandTotalKES = totalKES + deliveryKES; // NEW: Add delivery fee

        resultBox.innerHTML = `
            <div class="quote-box" style="border:1px solid #ccc; padding:15px; border-radius:8px;">
              <p><strong>Item Price:</strong> $${price.toFixed(2)}</p>
              <p><strong>Shipping & Service:</strong> $${(shipping + service).toFixed(2)}</p>
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

    // Update live as user types (both price and town)
    priceInput.addEventListener("input", updateResults);
    townInput.addEventListener("input", updateResults); // NEW: React to town changes

    // WhatsApp order (Updated)
    sendBtn.addEventListener("click", () => {
        const price = parseFloat(priceInput.value);
        const link = linkInput.value.trim();
        const town = townInput.value.trim(); // NEW
        const deliveryKES = getDeliveryFee(town); // NEW

        if (isNaN(price) || price <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        if (!town || deliveryKES === 0) { // NEW: Require a town selection with a valid fee
            alert("🚨 Please enter a delivery town and ensure the delivery fee is calculated before sending the order.");
            return;
        }

        const { totalKES } = calculateTotal(price);
        const grandTotalKES = totalKES + deliveryKES; // NEW

        const message = encodeURIComponent(
    	    `🛍 Buy For Me Request (Calculated)\n\n` +
            `🔗 Product Link: ${link}\n` +
            `💵 Item Price: $${price.toFixed(2)}\n` +
            `🚚 Delivery Town: ${town}\n` +
            `📦 Import/Service Total: ${totalKES.toLocaleString()} KES\n` +
            `💰 Delivery Fee: ${deliveryKES.toLocaleString()} KES\n\n` +
    	    `🔥 **GRAND TOTAL: ${grandTotalKES.toLocaleString()} KES**\n\nPlease confirm details.`
        );
        
        window.open(`https://wa.me/254106590617?text=${message}`, "_blank");
    });
    
    // Initialize results display when page loads
    updateResults();
});
