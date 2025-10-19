
// Simple site logic for Deenice Finds
const PRODUCTS = [
  {
    id: "p1",
    title: "Magsafe Battery pack 10,000Mah",
    price: 3900,
    currency: "KES",
    desc: "Portable Magnetic Wireless Power Bank (10000 mAh) - Premium design and magnetic wireless charging.",
    images: [
      "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg",
      "https://i.postimg.cc/D03nz6zL/Screenshot-2025-10-15-201118.png",
      "https://i.postimg.cc/RZpmt4Fx/image.png",
      "https://i.postimg.cc/kgHr4s1R/image.png",
      "https://i.postimg.cc/V6LXV9wM/image.png"
    ],
    colors: [
      {name:"White", img:"https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg"},
      {name:"Black", img:"https://i.postimg.cc/NGRrkPRs/Hf7fb927b9b97487da96fbd5dd5bc6badx.jpg"},
      {name:"Green (demo)", img:"https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg"},
      {name:"Pink (demo)", img:"https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg"}
    ]
  }
];

// generate 10 demo products (duplicates of p1 with different ids)
for(let i=2;i<=10;i++){
  const copy = JSON.parse(JSON.stringify(PRODUCTS[0]));
  copy.id = "p"+i;
  copy.title = copy.title + " — Demo " + i;
  copy.price = 3500 + i*100;
  PRODUCTS.push(copy);
}

// insert products in grid
const grid = document.getElementById('productsGrid');
function renderProducts(){
  PRODUCTS.forEach(p=>{
    const card = document.createElement('a');
    card.className = 'card';
    card.href = "product.html?id="+p.id;
    card.innerHTML = `<img loading="lazy" src="${p.images[0]}" alt="${p.title}"><h3>${p.title}</h3><p class="price">KES ${p.price.toLocaleString()}</p>`;
    grid.appendChild(card);
  });
}
renderProducts();

// Offers slider
let offerIndex = 0;
const slider = document.getElementById('offerSlider');
const slides = slider.querySelectorAll('.slide');
const dotsWrap = document.getElementById('dots');
slides.forEach((s,i)=>{
  const dot = document.createElement('div'); dot.className='dot'; if(i===0) dot.classList.add('active');
  dot.addEventListener('click', ()=>{ goToOffer(i); });
  dotsWrap.appendChild(dot);
});
function showOffer(i){
  slider.style.transform = `translateX(${-i*100}%)`;
  dotsWrap.querySelectorAll('.dot').forEach(d=>d.classList.remove('active'));
  dotsWrap.querySelectorAll('.dot')[i].classList.add('active');
}
function nextOffer(){ offerIndex=(offerIndex+1)%slides.length; showOffer(offerIndex); }
function prevOffer(){ offerIndex=(offerIndex-1+slides.length)%slides.length; showOffer(offerIndex); }
document.getElementById('nextOffer').addEventListener('click', nextOffer);
document.getElementById('prevOffer').addEventListener('click', prevOffer);
setInterval(nextOffer, 6000);

// Search behavior
const searchBtn = document.getElementById('searchBtn');
const searchBox = document.getElementById('searchBox');
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
searchBtn.addEventListener('click', ()=>{
  searchBox.classList.toggle('hidden');
  if(!searchBox.classList.contains('hidden')) searchInput.focus();
  document.querySelector('.site-header').style.background = searchBox.classList.contains('hidden') ? '' : 'var(--glass)';
});
searchInput.addEventListener('input', ()=>{
  const q = searchInput.value.toLowerCase().trim();
  suggestions.innerHTML = '';
  if(!q) return;
  const matches = PRODUCTS.filter(p=>p.title.toLowerCase().includes(q));
  matches.slice(0,6).forEach(m=>{
    const el = document.createElement('div'); el.className='suggestion';
    el.innerHTML = `<img src="${m.images[0]}"><div><strong>${m.title}</strong><div class="muted">KES ${m.price}</div></div>`;
    el.addEventListener('click', ()=>{ window.location.href='product.html?id='+m.id; });
    suggestions.appendChild(el);
  });
});

// Help center -> open Tidio conversation
document.getElementById('helpCenter').addEventListener('click', (e)=>{
  e.preventDefault();
  if(window.tidioChatApi) window.tidioChatApi.open();
  else alert('Tidio loading... please wait a second.');
});

// Cart and WhatsApp order forwarding
let cart = JSON.parse(localStorage.getItem('df_cart')||'[]');
const cartCount = document.getElementById('cartCount');
function updateCartCount(){ cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0); }
updateCartCount();

// Provide a simple exposed function for product page to add to cart
window.__Deenice = {
  PRODUCTS,
  addToCart(item){
    const found = cart.find(c=>c.id===item.id && c.color===item.color);
    if(found) found.qty += item.qty;
    else cart.push(item);
    localStorage.setItem('df_cart', JSON.stringify(cart));
    updateCartCount();
  },
  checkoutViaWhatsApp(){
    if(cart.length===0){ alert('Cart empty'); return; }
    const lines = cart.map(c=>`${c.qty} x ${c.title} (${c.color || 'N/A'}) - KES ${c.price}`);
    const msg = `Hello, I'm interested in the following items from Deenice Finds:%0A${lines.join('%0A')}%0A%0ATotal items: ${cart.reduce((s,i)=>s+i.qty,0)}`;
    const wa = 'https://wa.me/254106590617?text='+encodeURIComponent(msg);
    window.open(wa,'_blank');
  }
};
