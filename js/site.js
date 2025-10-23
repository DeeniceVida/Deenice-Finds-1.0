
async function loadProducts(){
  const res = await fetch('data/products.json');
  const products = await res.json();
  return products;
}

function createProductCard(p){
  const el = document.createElement('a');
  el.className = 'product-card';
  el.href = `product.html?id=${encodeURIComponent(p.id)}`;
  el.innerHTML = `
    <img loading="lazy" src="${p.images[0]}" alt="${p.title}" />
    <h3>${p.title}</h3>
    <div class="price">${p.price.toLocaleString()} ${p.currency}</div>
  `;
  return el;
}

async function renderGrid(){
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  const products = await loadProducts();
  products.slice(0,10).forEach(p=> grid.appendChild(createProductCard(p)));
  const cart = JSON.parse(localStorage.getItem('de_cart')||'[]');
  const badge = document.getElementById('cart-count');
  if(badge) badge.textContent = cart.length || 0;
}

function setupMobileNav(){
  const ham = document.querySelector('.hamburger');
  const nav = document.querySelector('.main-nav');
  if(!ham || !nav) return;
  ham.addEventListener('click', (e)=> {
    e.stopPropagation();
    nav.classList.toggle('open');
    ham.classList.toggle('open');
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.header-inner')){ nav.classList.remove('open'); ham.classList.remove('open'); }
  });
}

function showInitialSuggestions(){
  const suggestions = document.getElementById('search-suggestions');
  suggestions.innerHTML = '';
  const picks = window._products_for_suggestions||[];
  picks.slice(0,6).forEach(m=>{
    const r = document.createElement('div');
    r.className = 'suggestion';
    r.innerHTML = `<a href="product.html?id=${encodeURIComponent(m.id)}"><img src="${m.images[0]}" width="56" height="56" style="object-fit:cover;border-radius:6px;margin-right:8px"/>${m.title}</a>`;
    suggestions.appendChild(r);
  });
}

function setupSearch(products){
  window._products_for_suggestions = products;
  const toggle = document.getElementById('search-toggle');
  const box = document.getElementById('search-box');
  const input = document.getElementById('search-input');
  const suggestions = document.getElementById('search-suggestions');
  toggle.addEventListener('click', ()=> {
    box.classList.toggle('hidden');
    if(!box.classList.contains('hidden')) { input.focus(); showInitialSuggestions(); }
  });
  input.addEventListener('input',(e)=>{
    const q = e.target.value.toLowerCase();
    suggestions.innerHTML = '';
    if(!q) return showInitialSuggestions();
    const matches = products.filter(p=> (p.title+p.description).toLowerCase().includes(q)).slice(0,6);
    matches.forEach(m=>{
      const r = document.createElement('div');
      r.className = 'suggestion';
      r.innerHTML = `<a href="product.html?id=${encodeURIComponent(m.id)}"><img src="${m.images[0]}" width="56" height="56" style="object-fit:cover;border-radius:6px;margin-right:8px"/>${m.title}</a>`;
      suggestions.appendChild(r);
    });
  });
}

function setupOffers(){
  const slides = [
    {img:"https://i.postimg.cc/xT35t3WK/image.png"},
    {img:"https://i.postimg.cc/k4tGgwxc/image.png"},
    {img:"https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg"}
  ];
  const container = document.getElementById('offers-slider');
  const dots = document.getElementById('offers-dots');
  slides.forEach((s, i)=>{
    const d = document.createElement('div');
    d.className = 'slide';
    if(i===0) d.classList.add('active');
    d.style.backgroundImage = `url('${s.img}')`;
    container.appendChild(d);
    const btn = document.createElement('button');
    btn.addEventListener('click', ()=> showSlide(i));
    dots.appendChild(btn);
  });
  let idx=0, timer=null;
  function showSlide(n){
    const ss = container.querySelectorAll('.slide');
    ss.forEach((s,ii)=> s.classList.toggle('active', ii===n));
    idx=n; refreshDots();
  }
  function refreshDots(){ 
    const btns = dots.querySelectorAll('button'); 
    btns.forEach((b,i)=> b.style.opacity = i===idx?1:0.45); 
  }
  function next(){ showSlide((idx+1)%slides.length); }
  timer = setInterval(next,6000);
  document.getElementById('offers-prev').addEventListener('click', ()=> { showSlide((idx-1+slides.length)%slides.length); });
  document.getElementById('offers-next').addEventListener('click', ()=> { showSlide((idx+1)%slides.length); });
}

// ✅ Run it
document.addEventListener("DOMContentLoaded", () => {
  setupOffers();
});


document.addEventListener('DOMContentLoaded', async ()=>{
  const products = await loadProducts();
  renderGrid();
  setupSearch(products);
  setupOffers();
  setupMobileNav();
});
// Add this to site.js near the bottom
function revealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(r => observer.observe(r));
}

document.addEventListener('DOMContentLoaded', () => {
  revealOnScroll();
});
