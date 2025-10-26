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
/* POSTER SLIDER — Responsive + Swipe + Pause on Hover + Custom Timer         */
/* -------------------------------------------------------------------------- */
function setupOffers() {
  const slides = [
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418668/ad_1_desktop_3x-100_hmbljc.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418667/ad_1_mobile_3x-100_edwyal.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418672/as_2_desktop_3x-100_is2hkt.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418669/ad_1_mobile_copy_3x-100_dy46n7.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418908/as_4_desktop_3x-100_vhin3a.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418673/ad_4_mobile_3x-100_hgjitp.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418670/ad_3_desktop_3x-100_l6ydnv.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418671/ad_3_mobile_3x-100_lgtdpr.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418672/ad_5_desktop_3x-100_jksvwz.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418673/ad_5_mobile_3x-100_ze7qzo.jpg"
    }
  ];

  const container = document.getElementById("offers-slider");
  const dots = document.getElementById("offers-dots");
  if (!container || !dots) return;

  const isMobile = window.innerWidth <= 900;
  container.innerHTML = "";
  dots.innerHTML = "";

  slides.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    if (i === 0) slide.classList.add("active");
    slide.style.backgroundImage = `url('${isMobile ? s.mobile : s.desktop}')`;
    container.appendChild(slide);

    const dot = document.createElement("button");
    dot.addEventListener("click", () => showSlide(i));
    dots.appendChild(dot);
  });

  let idx = 0;
  const slideInterval = 7000; // 🕒 Change slide every 7 seconds
  let autoSlide;

  function showSlide(n) {
    const ss = container.querySelectorAll(".slide");
    ss.forEach((s, ii) => s.classList.toggle("active", ii === n));
    idx = n;
    refreshDots();
  }

  function refreshDots() {
    const btns = dots.querySelectorAll("button");
    btns.forEach((b, i) => (b.style.opacity = i === idx ? 1 : 0.45));
  }

  function next() {
    showSlide((idx + 1) % slides.length);
  }

  function prev() {
    showSlide((idx - 1 + slides.length) % slides.length);
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlide = setInterval(next, slideInterval);
  }

  function stopAutoSlide() {
    if (autoSlide) clearInterval(autoSlide);
  }

  // 🔁 Start automatic slideshow
  startAutoSlide();

  // Manual navigation buttons
  document.getElementById("offers-prev")?.addEventListener("click", () => {
    prev();
    startAutoSlide();
  });
  document.getElementById("offers-next")?.addEventListener("click", () => {
    next();
    startAutoSlide();
  });

  // 📱 Swipe gestures (mobile)
  let startX = 0;
  container.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });
  container.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prev() : next();
      startAutoSlide();
    }
  });

  // 🖱️ Pause on hover (desktop only)
  if (!isMobile) {
    container.addEventListener("mouseenter", stopAutoSlide);
    container.addEventListener("mouseleave", startAutoSlide);
  }
}

/* ✅ Reload correct images on resize */
window.addEventListener("resize", () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(setupOffers, 400);
});

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

/* -------------------------------------------------------------------------- */
/* ⭐ NEW: POSTER SLIDER - BOTTOM (with different content)                       */
/* -------------------------------------------------------------------------- */
const bottomSlides = [
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418908/as_4_desktop_3x-100_vhin3a.jpg", // Example: Use a different image set
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418673/ad_4_mobile_3x-100_hgjitp.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418670/ad_3_desktop_3x-100_l6ydnv.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418671/ad_3_mobile_3x-100_lgtdpr.jpg"
    }
    // Add more unique slide objects here for the bottom banner
];
/* -------------------------------------------------------------------------- */
/* ⭐ NEW: POSTER SLIDER - BOTTOM LOGIC                                       */
/* -------------------------------------------------------------------------- */
function setupBottomOffers() {
  // Use the new slides data
  const slides = bottomSlides; 

  // Use the new unique IDs from your HTML
  const container = document.getElementById("bottom-offers-slider");
  const dots = document.getElementById("bottom-offers-dots");
  if (!container || !dots) return;

  const isMobile = window.innerWidth <= 900;
  container.innerHTML = "";
  dots.innerHTML = "";

  slides.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";
    if (i === 0) slide.classList.add("active");
    slide.style.backgroundImage = `url('${isMobile ? s.mobile : s.desktop}')`;
    container.appendChild(slide);

    const dot = document.createElement("button");
    dot.addEventListener("click", () => showSlide(i));
    dots.appendChild(dot);
  });

  let idx = 0;
  const slideInterval = 7000; // 🕒 Change slide every 7 seconds
  let autoSlide;

  function showSlide(n) {
    const ss = container.querySelectorAll(".slide");
    ss.forEach((s, ii) => s.classList.toggle("active", ii === n));
    idx = n;
    refreshDots();
  }

  function refreshDots() {
    const btns = dots.querySelectorAll("button");
    btns.forEach((b, i) => (b.style.opacity = i === idx ? 1 : 0.45));
  }

  function next() {
    showSlide((idx + 1) % slides.length);
  }

  function prev() {
    showSlide((idx - 1 + slides.length) % slides.length);
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlide = setInterval(next, slideInterval);
  }

  function stopAutoSlide() {
    if (autoSlide) clearInterval(autoSlide);
  }

  // 🔁 Start automatic slideshow
  startAutoSlide();

  // Manual navigation buttons — TARGET UNIQUE IDs
  document.getElementById("bottom-offers-prev")?.addEventListener("click", () => {
    prev();
    startAutoSlide();
  });
  document.getElementById("bottom-offers-next")?.addEventListener("click", () => {
    next();
    startAutoSlide();
  });

  // 📱 Swipe gestures (mobile)
  let startX = 0;
  container.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });
  container.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prev() : next();
      startAutoSlide();
    }
  });

  // 🖱️ Pause on hover (desktop only)
  if (!isMobile) {
    container.addEventListener("mouseenter", stopAutoSlide);
    container.addEventListener("mouseleave", startAutoSlide);
  }
}
/* -------------------------------------------------------------------------- */
/* INITIALIZE                                                                 */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const products = await loadProducts();
  renderGrid();
  setupSearch(products);
  setupOffers(); // Calls the TOP slider
  setupBottomOffers(); // ⭐ NEW: Calls the BOTTOM slider
  setupMobileNav();
  revealOnScroll();
});
