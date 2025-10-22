
document.addEventListener('DOMContentLoaded', ()=>{
  const list = document.getElementById('cart-contents');
  const btn = document.getElementById('cart-send');
  const cart = JSON.parse(localStorage.getItem('de_cart')||'[]');
  if(!list) return;
  if(cart.length===0){ list.innerHTML = '<p>Your cart is empty.</p>'; if(btn) btn.style.display='none'; return; }
  let html = '<ul>';
  cart.forEach((it,idx)=> html += `<li>${it.title} — ${it.qty} × ${it.price} ${it.currency} — ${it.color}</li>`);
  html += '</ul>';
  list.innerHTML = html;
  if(btn) btn.addEventListener('click', ()=>{
    const cfg = window.DEENICE_CONFIG;
    const txt = encodeURIComponent('Order from Deenice Finds:\n' + cart.map(i=>`${i.title} x${i.qty} ${i.color} - ${i.price}${i.currency}`).join('\n'));
    window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`,'_blank');
  });
});
