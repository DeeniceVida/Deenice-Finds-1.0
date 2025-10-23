async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();
  return products;
}

function createProductCard(p) {
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

async function renderGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const products = await loadProducts();
  products.slice(0, 10).forEach(p => grid.appendChild(createProductCard(p)));

  const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = cart.length || 0;
}

/* -------------------------------------------------------------------------- */
/* ✅ FIXED: MOBILE NAVIGATION — works on Android & iPhone                     */
/* -------------------------------------------------------------------------- */
function setupMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.main-nav');
  const hasSubs = document.querySelectorAll('.main-nav .has-sub');

  if (!hamburger || !nav) return;

  // Toggle main menu
  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    nav.classList.toggle('open');
    hamburger.classList.toggle('open');
  });

  // Handle parent submenu toggling (for mobile)
  document.querySelectorAll('.main-nav .has-sub > a').forEach(link => {
    link.addEventListener('click', e => {
      const parent = link.parentElement;

      // Mobile only
      if (window.innerWidth <= 900) {
        const subMenu = parent.querySelector('.sub');

        // If submenu is not open yet, just open it (don’t navigate)
        if (!parent.classList.contains('open')) {
          e.preventDefault();
          e.stopPropagation();

          document.querySelectorAll('.main-nav .has-sub').forEach(i => i.classList.remove('open'));
          parent.classList.add('open');
        } 
        // If already open and user taps again, go to link
        else {
          window.location.href = link.getAttribute('href');
        }
      }
    });
  });

  // Allow submenu items to navigate normally
  document.querySelectorAll('.main-nav .has-sub .sub a').forEach(subLink => {
    subLink.addEventListener('click', e => {
      e.stopPropagation(); // keep nav stable
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // Close everything when tapping outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.main-nav') && !e.target.closest('.hamburger')) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hasSubs.forEach(i => i.classList.remove('open'));
    }
  });
}


/* -------------------------------------------------------------------------- */
/* SEARCH LOGIC                                                               */
/* -------------------------------------------------------------------------- */
function showInitialSuggestions() {
  const suggestions = document.getElementById('search-suggestions');
  suggestions.innerHTML = '';
  const picks = window._products_for_suggestions || [];
  picks.slice(0, 6).forEach(m => {
    const r = document.createElement('div');
    r.className = 'suggestion';
    r.innerHTML = `<a href="product.html?id=${encodeURIComponent(m.id)}">
      <img src="${m.images[0]}" width="56" height="56" style="object-fit:cover;border-radius:6px;margin-right:8px"/>${m.title}
    </a>`;
    suggestions.appendChild(r);
  });
}

function setupSearch(products) {
  window._products_for_suggestions = products;
  const toggle = document.getElementById('search-toggle');
  const box = document.getElementById('search-box');
  const input = document.getElementById('search-input');
  const suggestions = document.getElementById('search-suggestions');

  toggle.addEventListener('click', () => {
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
      input.focus();
      showInitialSuggestions();
    }
  });

  input.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    suggestions.innerHTML = '';
    if (!q) return showInitialSuggestions();

    const matches = products
      .filter(p => (p.title + p.description).toLowerCase().includes(q))
      .slice(0, 6);

    matches.forEach(m => {
      const r = document.createElement('div');
      r.className = 'suggestion';
      r.innerHTML = `<a href="product.html?id=${encodeURIComponent(m.id)}">
        <img src="${m.images[0]}" width="56" height="56" style="object-fit:cover;border-radius:6px;margin-right:8px"/>${m.title}
      </a>`;
      suggestions.appendChild(r);
    });
  });
}

/* -------------------------------------------------------------------------- */
/* POSTER SLIDER                                                              */
/* -------------------------------------------------------------------------- */
function setupOffers() {
  const slides = [
    { img: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761236101/ad_2_desktop_2x_osqqeq.png" },
    { img: "https://i.postimg.cc/k4tGgwxc/image.png" },
    { img: "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg" }
  ];

  const container = document.getElementById('offers-slider');
  const dots = document.getElementById('offers-dots');
  if (!container || !dots) return;

  slides.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'slide';
    if (i === 0) d.classList.add('active');
    d.style.backgroundImage = `url('${s.img}')`;
    container.appendChild(d);

    const btn = document.createElement('button');
    btn.addEventListener('click', () => showSlide(i));
    dots.appendChild(btn);
  });

  let idx = 0;
  function showSlide(n) {
    const ss = container.querySelectorAll('.slide');
    ss.forEach((s, ii) => s.classList.toggle('active', ii === n));
    idx = n;
    refreshDots();
  }

  function refreshDots() {
    const btns = dots.querySelectorAll('button');
    btns.forEach((b, i) => (b.style.opacity = i === idx ? 1 : 0.45));
  }

  function next() {
    showSlide((idx + 1) % slides.length);
  }

  setInterval(next, 6000);
  document.getElementById('offers-prev')?.addEventListener('click', () => showSlide((idx - 1 + slides.length) % slides.length));
  document.getElementById('offers-next')?.addEventListener('click', () => showSlide((idx + 1) % slides.length));
}

/* -------------------------------------------------------------------------- */
/* SCROLL ANIMATION                                                           */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* INITIALIZE                                                                 */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const products = await loadProducts();
  renderGrid();
  setupSearch(products);
  setupOffers();
  setupMobileNav();
  revealOnScroll();
});
