document.addEventListener("DOMContentLoaded", () => {
  const priceInput = document.getElementById("bfm-price");
  const linkInput = document.getElementById("bfm-link");
  const resultBox = document.getElementById("bfm-results");
  const sendBtn = document.getElementById("bfm-send");

  const USD_TO_KES = 135; // Adjust to your current exchange rate

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
    if (isNaN(price) || price <= 0) {
      resultBox.innerHTML = `<p style="color:#888;">Enter a valid price to see the total.</p>`;
      return;
    }

    const { shipping, service, totalUSD, totalKES } = calculateTotal(price);

    resultBox.innerHTML = `
      <div class="quote-box">
        <p><strong>Item Price:</strong> $${price.toFixed(2)}</p>
        <p><strong>Shipping Fee:</strong> $${shipping.toFixed(2)}</p>
        <p><strong>Service Fee:</strong> $${service.toFixed(2)}</p>
        <hr>
        <p><strong>Total (USD):</strong> $${totalUSD.toFixed(2)}</p>
        <p><strong>Total (KES):</strong> ${totalKES.toLocaleString("en-KE", {
          maximumFractionDigits: 0,
        })} KES</p>
      </div>
    `;
  }

  // Update live as user types
  priceInput.addEventListener("input", updateResults);

  // WhatsApp order
  sendBtn.addEventListener("click", () => {
    const price = parseFloat(priceInput.value);
    const link = linkInput.value.trim();
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    const { totalUSD, totalKES } = calculateTotal(price);

    const message = encodeURIComponent(
      `Buy For Me Request:\n\nProduct link: ${link}\nPrice: $${price.toFixed(
        2
      )}\nEstimated total: $${totalUSD.toFixed(
        2
      )} (${totalKES.toLocaleString()} KES)\n\nPlease confirm details.`
    );

    window.open(`https://wa.me/254106590617?text=${message}`, "_blank");
  });
});
