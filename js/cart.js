document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('cart-contents');
  const btn = document.getElementById('cart-send');
  const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');

  if (!list) return;

  // ✅ Add nice padding around cart
  document.body.style.padding = '16px';
  document.body.style.maxWidth = '700px';
  document.body.style.margin = '0 auto';

  if (cart.length === 0) {
    list.innerHTML = '<p>Your cart is empty.</p>';
    if (btn) btn.style.display = 'none';
    return;
  }

  let html = `
    <ul style="list-style:none;padding:0;margin:0;">
      ${cart.map(it => `
        <li style="
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
        </li>
      `).join('')}
    </ul>
  `;

  list.innerHTML = html;

  // ✅ Show name & city form before sending
  const form = document.createElement('div');
  form.innerHTML = `
    <h3>Your Details</h3>
    <label>Name:<br><input id="user-name" type="text" placeholder="Your name" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
    <label>City:<br><input id="user-city" type="text" placeholder="Your city" required style="width:100%;padding:8px;margin-bottom:10px;"></label>
  `;
  list.insertAdjacentElement('afterend', form);

  if (btn) {
    btn.addEventListener('click', () => {
      const name = document.getElementById('user-name').value.trim();
      const city = document.getElementById('user-city').value.trim();

      if (!name || !city) {
        alert('Please enter your name and city before sending your order.');
        return;
      }

      const cfg = window.DEENICE_CONFIG;
      const txt = encodeURIComponent(
        `🛍 *New Order from Deenice Finds*\n\n👤 Name: ${name}\n🏙 City: ${city}\n\n📦 Items:\n` +
        cart.map(i =>
          `- ${i.title} x${i.qty} (${i.color || 'Default'}) - ${i.price.toLocaleString()}${i.currency}`
        ).join('\n') +
        `\n\nTotal: ${cart.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString()} ${cart[0]?.currency || 'KES'}`
      );

      window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`, '_blank');
    });
  }
});
