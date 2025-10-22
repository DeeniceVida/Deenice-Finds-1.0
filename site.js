
let offerIdx = 0;
function showOffer(n){
  const slides = document.querySelectorAll('.slide');
  const dots = document.getElementById('dots');
  slides.forEach((s,i)=> s.classList.toggle('active', i===n));
  const dotBtns = dots.querySelectorAll('button');
  dotBtns.forEach((b,i)=> b.classList.toggle('active', i===n));
}
function nextOffer(dir=1){
  const slides = document.querySelectorAll('.slide');
  offerIdx = (offerIdx + dir + slides.length) % slides.length;
  showOffer(offerIdx);
}
document.addEventListener('DOMContentLoaded',()=>{
  const slides = document.querySelectorAll('.slide');
  const dots = document.getElementById('dots');
  slides.forEach((_,i)=>{
    const b = document.createElement('button');
    b.addEventListener('click', ()=> { offerIdx = i; showOffer(i); });
    dots.appendChild(b);
  });
  showOffer(0);
  document.getElementById('prevOffer').addEventListener('click', ()=> nextOffer(-1));
  document.getElementById('nextOffer').addEventListener('click', ()=> nextOffer(1));
  setInterval(()=> nextOffer(1), 6000);

  const searchBtn = document.getElementById('searchBtn');
  const searchBox = document.getElementById('searchBox');
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestions');
  const products = window.PRODUCTS || [];
  searchBtn.addEventListener('click', ()=>{
    searchBox.classList.toggle('hidden');
    if(!searchBox.classList.contains('hidden')){
      searchInput.focus();
      searchBox.querySelector('input').value='';
    }
  });
  searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase();
    suggestions.innerHTML='';
    if(!q) { suggestions.style.display='none'; return; }
    const matches = products.filter(p=> (p.title+p.short+p.description).toLowerCase().includes(q)).slice(0,6);
    matches.forEach(m=>{
      const el = document.createElement('div');
      el.className='sugg';
      el.innerHTML = `<img src="${m.images[0]}" width="48" height="48" style="object-fit:cover;margin-right:8px;border-radius:6px"/> <div><strong>${m.title}</strong><div style="font-size:12px">KES ${m.price.toLocaleString()}</div></div>`;
      el.addEventListener('click', ()=> location.href = 'product.html?id='+m.id);
      suggestions.appendChild(el);
    });
    suggestions.style.display = matches.length? 'block':'none';
  });

  document.getElementById('openTidio').addEventListener('click', (e)=>{
    e.preventDefault();
    if(window.tidioChat) tidioChat.open();
  });

  const cartCount = document.getElementById('cartCount');
  function updateCartCount(){ const c = JSON.parse(localStorage.getItem('df_cart')||'[]'); cartCount.innerText = c.length; }
  updateCartCount();
});

(function(){
  if(!location.pathname.endsWith('product.html')) return;
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id')||'1');
  const p = (window.PRODUCTS||[]).find(x=>x.id===id);
  if(!p) return;
  document.title = p.title + ' — Deenice Finds';
  document.getElementById('productTitle').innerText = p.title;
  document.getElementById('productPrice').innerText = 'KES ' + p.price.toLocaleString();
  const gallery = document.getElementById('gallery');
  p.images.forEach((src,i)=>{
    const img = document.createElement('img');
    img.src = src; img.loading='lazy'; img.className = i===0? 'active':'';
    gallery.appendChild(img);
  });
  const colorsWrap = document.getElementById('colorOptions');
  p.colors.forEach((c,idx)=>{
    const el = document.createElement('button');
    el.className='colorBtn';
    el.innerHTML = `<img src="${c.img}" alt="${c.name}" loading="lazy" /><div>${c.name}</div>`;
    el.addEventListener('click', ()=> {
      document.querySelectorAll('.colorBtn').forEach(b=>b.classList.remove('selected'));
      el.classList.add('selected');
    });
    colorsWrap.appendChild(el);
  });
  document.getElementById('orderNow').addEventListener('click', ()=>{
    const qty = parseInt(document.getElementById('qty').value||'1');
    const selectedColor = (document.querySelector('.colorBtn.selected')||{innerText:'Default'}).innerText;
    const msg = `Hello, I'm interested in ${p.title} (SKU ${p.sku}). Price: KES ${p.price}. Quantity: ${qty}. Color: ${selectedColor}.`;
    const phone = '+254106590617';
    const url = 'https://wa.me/'+phone.replace(/\D/g,'')+'?text='+encodeURIComponent(msg);
    window.open(url,'_blank');
  });
})();

(function(){
  if(!location.pathname.endsWith('buyforme.html')) return;
  const rate = 135;
  const priceInput = document.getElementById('bf_price');
  const resultBox = document.getElementById('bf_result');
  function compute(){
    let usd = parseFloat(priceInput.value||'0');
    if(isNaN(usd)) usd = 0;
    const shipping = 20 + usd * 0.035;
    const service = usd > 750 ? usd * 0.045 : 30;
    const totalUSD = usd + shipping + service;
    const totalKES = Math.round(totalUSD * rate);
    resultBox.innerText = `Quote: USD ${totalUSD.toFixed(2)} • KES ${totalKES.toLocaleString()} • Delivery: 3 weeks`;
    document.getElementById('bf_place').href = 'https://wa.me/254106590617?text=' + encodeURIComponent(`Buy for me quote: USD ${totalUSD.toFixed(2)} • KES ${totalKES.toLocaleString()} • Link: ${document.getElementById('bf_link').value}`);
  }
  document.getElementById('bf_price').addEventListener('input', compute);
  document.getElementById('bf_link').addEventListener('input', compute);
})();
