// Buy-For-Me — Fixed Script with Town Suggestions & Price Calculations
(() => {
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
    { name: "Moi's Bridge", fee: 530, type: 'suggested' },
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
    { name: "Murang'a", fee: 420, type: 'suggested' },
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

  // WhatsApp number
  const WHATSAPP_NUMBER = "254106590617";

  // Currency conversion
  const USD_TO_KES = 135;

  // --- SIMPLE STORAGE ---
  function saveOrderToStorage(orderData) {
      try {
          // Save to admin storage
          const adminStorageKey = 'de_admin_orders_secure_v3';
          let adminOrders = JSON.parse(localStorage.getItem(adminStorageKey) || '[]');
          
          // Check if order exists
          const exists = adminOrders.find(order => order.id === orderData.id);
          if (!exists) {
              adminOrders.unshift(orderData);
              localStorage.setItem(adminStorageKey, JSON.stringify(adminOrders));
          }
          
          // Save to client storage
          const clientStorageKey = 'de_order_history';
          let clientOrders = JSON.parse(localStorage.getItem(clientStorageKey) || '[]');
          
          const clientExists = clientOrders.find(order => order.id === orderData.id);
          if (!clientExists) {
              clientOrders.unshift(orderData);
              localStorage.setItem(clientStorageKey, JSON.stringify(clientOrders));
          }
          
          console.log('✅ Order saved to storage');
          return true;
      } catch (error) {
          console.error('❌ Storage error:', error);
          return false;
      }
  }

  // --- HELPER FUNCTIONS ---
  function normalizeTownName(name = "") {
      return name.toLowerCase().replace(/\s+/g, " ").trim().replace(/\s*\(.*?\)\s*/g, "");
  }

  function getDeliveryFee(town = "") {
      const cleanedTown = normalizeTownName(town);
      if (!cleanedTown) return 0;

      const matchedNairobi = NAIROBI_DISTANCES.find(z => cleanedTown.includes(z.name.toLowerCase()));
      if (matchedNairobi) {
          const fee = Math.round(matchedNairobi.distance * DELIVERY_RATE_PER_KM);
          return Math.max(fee, MINIMUM_NAIROBI_FEE);
      }

      const exactMatch = DELIVERY_ZONES.find(z => normalizeTownName(z.name) === cleanedTown);
      if (exactMatch) return exactMatch.fee;

      const includeMatch = DELIVERY_ZONES.find(z => cleanedTown.includes(normalizeTownName(z.name)));
      if (includeMatch) return includeMatch.fee;

      return 0;
  }

  function updateCityFeedback(town) {
      const feedbackDiv = document.getElementById('bfm-city-feedback');
      if (!feedbackDiv) return;

      const townFee = getDeliveryFee(town);
      feedbackDiv.style.padding = '8px';
      feedbackDiv.style.borderRadius = '4px';

      if (townFee > 0) {
          feedbackDiv.style.backgroundColor = '#d4edda';
          feedbackDiv.innerHTML = `<strong>Delivery Fee for ${town}:</strong> ${townFee.toLocaleString()} KES`;
      } else {
          feedbackDiv.style.backgroundColor = '#f0f8ff';
          feedbackDiv.innerHTML = `<strong>Delivery Fee:</strong> TBD. Type your town for suggestion.`;
      }
  }

  function calculateTotal(price, link) {
      let shipping, service, appleFee;

      if (price <= 750) {
          shipping = 20 + 0.035 * price;
          service = 30;
      } else {
          shipping = 20 + 0.035 * price;
          service = 0.045 * price;
      }

      const isAppleLink = typeof link === 'string' && link.toLowerCase().includes('apple.com');
      appleFee = isAppleLink ? APPLE_PICKUP_FEE_USD : 0.00;

      const totalUSD = price + shipping + service + appleFee;
      return { shipping, service, appleFee, totalUSD };
  }

  function extractProductTitleFromURL(url) {
      try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;

          if (hostname.includes('amazon.')) {
              const titleMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
              if (titleMatch) {
                  return `Amazon Product (ASIN: ${titleMatch[1]})`;
              }
          }

          const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
          if (pathParts.length > 0) {
              const lastPart = pathParts[pathParts.length - 1];
              const pretty = lastPart.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return `${pretty} from ${hostname.replace('www.', '')}`;
          }

          return `Product from ${hostname.replace('www.', '')}`;
      } catch (e) {
          return 'Buy For Me Product';
      }
  }

  function renderResults(resultBox, price, link, town) {
      if (!resultBox) return;
      const deliveryKES = getDeliveryFee(town);
      
      // Check if price is valid
      if (isNaN(price) || price <= 0) {
          resultBox.innerHTML = `<p style="color:#888;">Enter a valid price to see the total.</p>`;
          return;
      }

      const { shipping, service, appleFee, totalUSD } = calculateTotal(price, link);
      const totalKES = Math.round(totalUSD * USD_TO_KES);
      const grandTotalKES = totalKES + deliveryKES;

      const appleFeeDisplay = appleFee > 0 ? `<p class="special-fee-notice"><strong>Apple Pick Up Fee:</strong> $${appleFee.toFixed(2)}</p>` : '';

      resultBox.innerHTML = `
        <div class="quote-box" style="border:1px solid #ccc; padding:15px; border-radius:8px;">
          <p><strong>Item Price:</strong> $${price.toFixed(2)}</p>
          <p><strong>Shipping & Service:</strong> $${(shipping + service).toFixed(2)}</p>
          ${appleFeeDisplay}
          <hr style="margin:10px 0;">
          <p><strong>Total Import Cost (USD):</strong> $${totalUSD.toFixed(2)}</p>
          <p><strong>Import/Buy Total (KES):</strong> ${totalKES.toLocaleString("en-KE", { maximumFractionDigits: 0 })} KES</p>
          <p><strong>Delivery Fee (${town || 'TBD'}):</strong> ${deliveryKES.toLocaleString("en-KE", { maximumFractionDigits: 0 })} KES</p>
          <hr style="margin:10px 0;">
          <p style="font-size:1.2em; color:#007bff;">
            <strong>GRAND TOTAL (KES):</strong>
            <span style="float:right;">${grandTotalKES.toLocaleString("en-KE", { maximumFractionDigits: 0 })} KES</span>
          </p>
        </div>
      `;
  }

  // --- TOWN SUGGESTIONS FUNCTION ---
  function setupTownSuggestions() {
      const townInput = document.getElementById('bfm-town');
      const dataList = document.getElementById('bfm-city-suggestions-list');
      
      if (!townInput || !dataList) {
          console.log('Town suggestions elements not found');
          return;
      }

      // Create list of all towns
      const allTowns = [
          ...NAIROBI_DISTANCES.map(z => z.name),
          ...DELIVERY_ZONES.map(z => z.name)
      ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      // Clear existing options
      dataList.innerHTML = '';
      
      // Add options to datalist
      allTowns.forEach(town => {
          const option = document.createElement('option');
          option.value = town;
          dataList.appendChild(option);
      });

      console.log(`✅ Setup ${allTowns.length} town suggestions`);
  }

  // --- LIVE PRICE CALCULATION FUNCTION ---
  function setupLiveCalculations() {
      const priceInput = document.getElementById('bfm-price');
      const linkInput = document.getElementById('bfm-link');
      const townInput = document.getElementById('bfm-town');
      const resultBox = document.getElementById('bfm-results');

      if (!priceInput || !linkInput || !townInput || !resultBox) {
          console.error('Required elements for live calculations not found');
          return;
      }

      function updateCalculations() {
          const price = parseFloat(priceInput.value) || 0;
          const link = linkInput.value.trim();
          const town = townInput.value.trim();

          // Update delivery fee feedback
          updateCityFeedback(town);
          
          // Update price calculations
          renderResults(resultBox, price, link, town);
      }

      // Add event listeners for live updates
      priceInput.addEventListener('input', updateCalculations);
      linkInput.addEventListener('input', updateCalculations);
      townInput.addEventListener('input', updateCalculations);

      console.log('✅ Live calculations setup complete');
  }

  // --- MAIN INIT ---
  document.addEventListener("DOMContentLoaded", () => {
      console.log('🏁 Buy For Me page loading...');
      
      const priceInput = document.getElementById("bfm-price");
      const linkInput = document.getElementById("bfm-link");
      const townInput = document.getElementById("bfm-town");
      const resultBox = document.getElementById("bfm-results");
      const sendBtn = document.getElementById("bfm-send");

      if (!priceInput || !linkInput || !townInput || !resultBox) {
          console.error('❌ Required BFM elements missing');
          return;
      }

      // 1. Setup town suggestions
      setupTownSuggestions();

      // 2. Setup live calculations
      setupLiveCalculations();

      // 3. Setup WhatsApp button
      if (sendBtn) {
          sendBtn.addEventListener("click", (e) => {
              e.preventDefault();
              console.log('🟢 WhatsApp button clicked');

              const price = parseFloat(priceInput.value);
              const link = linkInput.value.trim();
              const town = townInput.value.trim();

              // Validation
              if (!link) {
                  alert("⚠️ Product Link is required");
                  return;
              }
              
              if (isNaN(price) || price <= 0) {
                  alert("⚠️ Please enter a valid price");
                  return;
              }
              
              if (!town) {
                  alert("🚨 Please enter a delivery town");
                  return;
              }

              const deliveryKES = getDeliveryFee(town);
              const { appleFee, totalUSD } = calculateTotal(price, link);
              const totalKES = Math.round(totalUSD * USD_TO_KES);
              const grandTotalKES = totalKES + deliveryKES;

              // Create order data - NO IMAGE FIELD
              const orderData = {
                  id: 'BFM' + Date.now().toString(36).toUpperCase(),
                  orderDate: new Date().toISOString(),
                  status: 'pending',
                  type: 'buy-for-me',
                  source: 'buy-for-me',
                  customer: {
                      name: 'Buy For Me Customer',
                      city: town,
                      phone: 'Provided via WhatsApp'
                  },
                  items: [{
                      title: extractProductTitleFromURL(link),
                      price: price,
                      qty: 1,
                      link: link,
                      type: 'buy-for-me'
                      // NO image field - admin will add it
                  }],
                  totalAmount: grandTotalKES,
                  delivery: {
                      method: 'delivery',
                      city: town,
                      fee: deliveryKES
                  }
                  // NO image field at root - admin will add it
              };

              // Save order quietly
              saveOrderToStorage(orderData);

              // Create WhatsApp message
              const message = [
                  "🛍 Buy For Me Request",
                  "",
                  `🔗 Product: ${extractProductTitleFromURL(link)}`,
                  `🔗 Link: ${link}`,
                  `💵 Price: $${price.toFixed(2)}`,
                  `🏠 Delivery: ${town}`,
                  "",
                  "💰 Cost Breakdown:",
                  ` • Item: $${price.toFixed(2)}`,
                  ` • Shipping & Service: $${(totalUSD - price - appleFee).toFixed(2)}`,
                  ...(appleFee > 0 ? [` • Apple Fee: $${appleFee.toFixed(2)}`] : []),
                  ` • Total USD: $${totalUSD.toFixed(2)}`,
                  ` • Total KES: ${totalKES.toLocaleString()} KES`,
                  ` • Delivery: ${deliveryKES.toLocaleString()} KES`,
                  ` • GRAND TOTAL: ${grandTotalKES.toLocaleString()} KES`,
                  "",
                  "Please provide:",
                  " • Full Name",
                  " • Phone Number", 
                  " • Exact Address",
                  "",
                  "We'll contact you to complete the order!"
              ].join("\n");

              const encodedMessage = encodeURIComponent(message);
              const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

              // Open WhatsApp
              window.open(whatsappURL, '_blank');
              
              alert('✅ Opening WhatsApp... Please send the message to complete your order.');
          });
          
          console.log('✅ WhatsApp button setup complete');
      }

      // 4. Initial render with default values
      const initialPrice = parseFloat(priceInput.value) || 0;
      const initialLink = linkInput.value.trim() || '';
      const initialTown = townInput.value.trim() || '';
      
      updateCityFeedback(initialTown);
      renderResults(resultBox, initialPrice, initialLink, initialTown);

      console.log('✅ Buy For Me page initialized successfully');
  });
})();
