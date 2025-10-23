document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("cart-contents");
  const btn = document.getElementById("cart-send");
  let cart = JSON.parse(localStorage.getItem("de_cart") || "[]");

  function saveCart() {
    localStorage.setItem("de_cart", JSON.stringify(cart));
  }

  function renderCart() {
    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = "<p>Your cart is empty.</p>";
      if (btn) btn.style.display = "none";
      return;
    }

    let html = "<ul class='cart-list'>";
    cart.forEach((it, idx) => {
      html += `
        <li class="cart-item">
          <span class="cart-title">${it.title}</span>
          <span class="cart-details">${it.color || ""}</span>
          <div class="cart-qty">
            <button class="qty-btn minus" data-idx="${idx}">−</button>
            <span>${it.qty}</span>
            <button class="qty-btn plus" data-idx="${idx}">+</button>
          </div>
          <span class="cart-price">${(it.price * it.qty).toLocaleString()} ${it.currency}</span>
        </li>
      `;
    });
    html += "</ul>";
    list.innerHTML = html;

    // Attach event listeners for + and − buttons
    document.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        if (btn.classList.contains("plus")) {
          cart[idx].qty++;
        } else if (btn.classList.contains("minus")) {
          cart[idx].qty--;
          if (cart[idx].qty <= 0) cart.splice(idx, 1);
        }
        saveCart();
        renderCart();
      });
    });
  }

  renderCart();

  if (btn) {
    btn.addEventListener("click", () => {
      const cfg = window.DEENICE_CONFIG;
      const txt = encodeURIComponent(
        "Order from Deenice Finds:\n" +
          cart
            .map(
              (i) =>
                `${i.title} x${i.qty} ${i.color || ""} - ${i.price}${i.currency}`
            )
            .join("\n")
      );
      window.open(
        `https://wa.me/${cfg.whatsappNumber.replace("+", "")}?text=${txt}`,
        "_blank"
      );
    });
  }
});
