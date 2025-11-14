// site.js - SIMPLIFIED VERSION - Just loads products normally
async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    const products = await res.json();
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

function createProductCard(p) {
  const el = document.createElement('a');
  el.className = 'product-card';
  el.href = `product.html?id=${encodeURIComponent(p.id)}`;
  
  const stock = p.stock || 0;
  const stockStatus = getStockStatus(stock);
  const stockText = getStockText(stock);
  const isAvailable = stock > 0;

  el.innerHTML = `
    <img loading="lazy" src="${p.images[0]}" alt="${p.title}" />
    <h3>${p.title}</h3>
    <div class="price">
      ${p.originalPrice ? `<span class="original-price">${p.currency} ${p.originalPrice.toLocaleString()}</span>` : ''}
      <span class="current-price">${p.currency} ${p.price.toLocaleString()}</span>
    </div>
    <div class="product-stock stock-${stockStatus}">
      ${stockText}
    </div>
    ${!isAvailable ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
  `;
  
  return el;
}

// Simple stock helper functions
function getStockStatus(stock) {
  if (stock > 10) return 'in-stock';
  if (stock > 0) return 'low-stock';
  return 'out-of-stock';
}

function getStockText(stock) {
  if (stock > 10) return 'In Stock Kenya';
  if (stock > 0) return 'Low Stock Kenya';
  return 'Out of Stock Kenya';
}

async function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  try {
    const products = await loadProducts();
    
    // Clear any existing content
    grid.innerHTML = '';
    
    // Show all products (or limit if you want)
    const productsToShow = products.slice(0, 12); // Show first 12 products
    
    if (productsToShow.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
          <div style="margin-bottom: 15px; font-size: 3em;">📦</div>
          <div style="margin-bottom: 10px;">No Products Available</div>
          <small>Check back later for new arrivals</small>
        </div>
      `;
      return;
    }

    productsToShow.forEach(p => {
      grid.appendChild(createProductCard(p));
    });

  } catch (error) {
    console.error('Error rendering products:', error);
    const grid = document.getElementById('product-grid');
    grid.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #666;">
        <div style="margin-bottom: 15px; font-size: 3em; color: #dc3545;">⚠️</div>
        <div style="margin-bottom: 10px;">Unable to Load Products</div>
        <small>Please check your internet connection</small>
        <div style="margin-top: 20px;">
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Try Again
          </button>
        </div>
      </div>
    `;
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('de_cart') || '[]');
  const badge = document.getElementById('cart-count');
  if (badge) {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalItems;
  }
}

/* -------------------------------------------------------------------------- */
/* MOBILE NAVIGATION (Keep this as is) */
/* -------------------------------------------------------------------------- */
function setupMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.main-nav');
  const hasSubs = document.querySelectorAll('.main-nav .has-sub');

  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    nav.classList.toggle('open');
    hamburger.classList.toggle('open');
    
    if (!nav.classList.contains('open')) {
      closeAllSubmenus();
    }
  });

  document.querySelectorAll('.main-nav .has-sub > a').forEach(link => {
    link.addEventListener('click', e => {
      const parent = link.parentElement;
      if (window.innerWidth <= 900) {
        const subMenu = parent.querySelector('.sub');
        if (!parent.classList.contains('open')) {
          e.preventDefault();
          e.stopPropagation();
          closeAllSubmenus();
          parent.classList.add('open');
        } else {
          window.location.href = link.getAttribute('href');
        }
      }
    });
  });

  document.querySelectorAll('.main-nav .has-sub .sub a').forEach(subLink => {
    subLink.addEventListener('click', e => {
      e.stopPropagation();
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      closeAllSubmenus();
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.main-nav') && !e.target.closest('.hamburger')) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      closeAllSubmenus();
    }
  });

  document.querySelectorAll('.main-nav > ul > li:not(.has-sub) > a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      closeAllSubmenus();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllSubmenus();
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

function closeAllSubmenus() {
  document.querySelectorAll('.main-nav .has-sub').forEach(item => {
    item.classList.remove('open');
  });
}

/* -------------------------------------------------------------------------- */
/* SEARCH LOGIC (Keep this as is) */
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
/* SLIDER LOGIC (Keep this as is) */
/* -------------------------------------------------------------------------- */
const topSlides = [
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

const bottomSlides = [
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418908/as_4_desktop_3x-100_vhin3a.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418673/ad_4_mobile_3x-100_hgjitp.jpg"
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418670/ad_3_desktop_3x-100_l6ydnv.jpg",
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418671/ad_3_mobile_3x-100_lgtdpr.jpg"
    }
];

function initializeSlider(slidesData, sliderId, prevId, nextId, dotsId) {
    const container = document.getElementById(sliderId);
    const dots = document.getElementById(dotsId);
    if (!container || !dots) return;

    container.innerHTML = "";
    dots.innerHTML = "";

    const isMobile = window.innerWidth <= 900;
    
    slidesData.forEach((s, i) => {
        const slide = document.createElement("div");
        slide.className = "slide";
        if (i === 0) slide.classList.add("active");
        slide.style.backgroundImage = `url('${isMobile ? s.mobile : s.desktop}')`;
        container.appendChild(slide);

        const dot = document.createElement("button");
        dot.addEventListener("click", () => showSlide(i));
        if (i === 0) dot.classList.add("active");
        dots.appendChild(dot);
    });

    let idx = 0;
    const slideInterval = 5000;
    const transitionDuration = 800;
    let autoSlide;
    let isTransitioning = false;

    function showSlide(n) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        const ss = container.querySelectorAll(".slide");
        const currentSlide = ss[idx];
        const nextSlide = ss[n];
        
        currentSlide.classList.remove("active");
        
        setTimeout(() => {
            nextSlide.classList.add("active");
            idx = n;
            refreshDots();
            
            setTimeout(() => {
                isTransitioning = false;
            }, transitionDuration);
        }, 50);
    }

    function refreshDots() {
        const btns = dots.querySelectorAll("button");
        btns.forEach((b, i) => {
            if (i === idx) {
                b.classList.add("active");
                b.style.opacity = "1";
            } else {
                b.classList.remove("active");
                b.style.opacity = "0.45";
            }
        });
    }

    function next() {
        if (isTransitioning) return;
        showSlide((idx + 1) % slidesData.length);
    }

    function prev() {
        if (isTransitioning) return;
        showSlide((idx - 1 + slidesData.length) % slidesData.length);
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlide = setInterval(() => {
            if (!isTransitioning) {
                next();
            }
        }, slideInterval);
    }

    function stopAutoSlide() {
        if (autoSlide) clearInterval(autoSlide);
    }

    startAutoSlide();

    document.getElementById(prevId)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isTransitioning) {
            prev();
            startAutoSlide();
        }
    });
    
    document.getElementById(nextId)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isTransitioning) {
            next();
            startAutoSlide();
        }
    });

    let startX = 0;
    let startTime = 0;
    
    container.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startTime = Date.now();
        stopAutoSlide();
    });
    
    container.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const endTime = Date.now();
        const diff = endX - startX;
        const timeDiff = endTime - startTime;
        
        if (Math.abs(diff) > 50 && timeDiff < 300 && !isTransitioning) {
            if (diff > 0) {
                prev();
            } else {
                next();
            }
        }
        
        setTimeout(startAutoSlide, 3000);
    });

    if (!isMobile) {
        container.addEventListener("mouseenter", () => {
            stopAutoSlide();
        });
        
        container.addEventListener("mouseleave", () => {
            setTimeout(startAutoSlide, 1000);
        });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoSlide();
        } else {
            setTimeout(startAutoSlide, 2000);
        }
    });

    preloadSliderImages(slidesData, isMobile);
}

function preloadSliderImages(slidesData, isMobile) {
    slidesData.forEach(slide => {
        const img = new Image();
        img.src = isMobile ? slide.mobile : slide.desktop;
    });
}

function setupAllOffers() {
    initializeSlider(
        topSlides,
        "offers-slider",
        "offers-prev",
        "offers-next",
        "offers-dots"
    );

    initializeSlider(
        bottomSlides,
        "bottom-offers-slider",
        "bottom-offers-prev",
        "bottom-offers-next",
        "bottom-offers-dots"
    );
}

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setupAllOffers();
    }, 250);
});

/* -------------------------------------------------------------------------- */
/* SCROLL ANIMATION */
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
/* INITIALIZE EVERYTHING */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const products = await loadProducts();
  renderProducts(); // This loads products normally
  setupSearch(products);
  setupAllOffers();
  setupMobileNav();
  revealOnScroll();
  updateCartCount();
});

// Make function globally available
window.renderProducts = renderProducts;
