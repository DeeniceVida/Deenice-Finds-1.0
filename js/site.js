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
/* ✅ FIXED: MOBILE NAVIGATION — with proper submenu closing                  */
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
    
    // Close all submenus when hamburger closes
    if (!nav.classList.contains('open')) {
      closeAllSubmenus();
    }
  });

  // Handle parent submenu toggling (for mobile)
  document.querySelectorAll('.main-nav .has-sub > a').forEach(link => {
    link.addEventListener('click', e => {
      const parent = link.parentElement;

      // Mobile only
      if (window.innerWidth <= 900) {
        const subMenu = parent.querySelector('.sub');

        // If submenu is not open yet, just open it (don't navigate)
        if (!parent.classList.contains('open')) {
          e.preventDefault();
          e.stopPropagation();

          // Close all other submenus first
          closeAllSubmenus();
          
          // Open this submenu
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
      closeAllSubmenus();
    });
  });

  // Close everything when tapping outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.main-nav') && !e.target.closest('.hamburger')) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      closeAllSubmenus();
    }
  });

  // Close submenus when clicking on any non-submenu link in main nav
  document.querySelectorAll('.main-nav > ul > li:not(.has-sub) > a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      closeAllSubmenus();
    });
  });

  // Close submenus when pressing Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllSubmenus();
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
}

// Function to close all submenus
function closeAllSubmenus() {
  document.querySelectorAll('.main-nav .has-sub').forEach(item => {
    item.classList.remove('open');
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
/* SLIDER DATA AND LOGIC - ALL REFACTORED                                     */
/* -------------------------------------------------------------------------- */

// TOP SLIDES DATA (Renamed from 'slides')
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

// BOTTOM SLIDES DATA (Unique content)
const bottomSlides = [
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418908/as_4_desktop_3x-100_vhin3a.jpg", // REPLACE with unique content
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418673/ad_4_mobile_3x-100_hgjitp.jpg" // REPLACE with unique content
    },
    {
      desktop: "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418670/ad_3_desktop_3x-100_l6ydnv.jpg", // REPLACE with unique content
      mobile:  "https://res.cloudinary.com/dsthpp4oj/image/upload/v1761418671/ad_3_mobile_3x-100_lgtdpr.jpg" // REPLACE with unique content
    }
];

/* -------------------------------------------------------------------------- */
/* ✅ SMOOTH SLIDER FUNCTION - FIXED TRANSITIONS & TIMING                     */
/* -------------------------------------------------------------------------- */
function initializeSlider(slidesData, sliderId, prevId, nextId, dotsId) {
    const container = document.getElementById(sliderId);
    const dots = document.getElementById(dotsId);
    if (!container || !dots) return;

    // Clear existing content
    container.innerHTML = "";
    dots.innerHTML = "";

    const isMobile = window.innerWidth <= 900;
    
    // Build Slides
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
    const slideInterval = 5000; // Increased to 5 seconds for better UX
    const transitionDuration = 800; // Match CSS transition duration
    let autoSlide;
    let isTransitioning = false; // CRITICAL: Prevent overlapping transitions

    function showSlide(n) {
        // Prevent rapid clicking/overlapping transitions
        if (isTransitioning) return;
        isTransitioning = true;
        
        const ss = container.querySelectorAll(".slide");
        const currentSlide = ss[idx];
        const nextSlide = ss[n];
        
        // Remove active class from current slide
        currentSlide.classList.remove("active");
        
        // Add active class to new slide
        setTimeout(() => {
            nextSlide.classList.add("active");
            idx = n;
            refreshDots();
            
            // Reset transition flag after transition completes
            setTimeout(() => {
                isTransitioning = false;
            }, transitionDuration);
        }, 50); // Small delay to ensure CSS transition works properly
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

    // Start automatic slideshow
    startAutoSlide();

    // Setup Controls
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

    // Enhanced swipe gestures with better timing
    let startX = 0;
    let startTime = 0;
    
    container.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startTime = Date.now();
        stopAutoSlide(); // Pause autoplay during interaction
    });
    
    container.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const endTime = Date.now();
        const diff = endX - startX;
        const timeDiff = endTime - startTime;
        
        // Only register as swipe if movement is significant and quick
        if (Math.abs(diff) > 50 && timeDiff < 300 && !isTransitioning) {
            if (diff > 0) {
                prev();
            } else {
                next();
            }
        }
        
        // Restart autoplay after a delay
        setTimeout(startAutoSlide, 3000);
    });

    // Pause on hover (desktop only) with better timing
    if (!isMobile) {
        container.addEventListener("mouseenter", () => {
            stopAutoSlide();
        });
        
        container.addEventListener("mouseleave", () => {
            // Wait a bit before restarting to avoid immediate transition
            setTimeout(startAutoSlide, 1000);
        });
    }

    // Handle tab visibility changes
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoSlide();
        } else {
            // Don't restart immediately when tab becomes visible
            setTimeout(startAutoSlide, 2000);
        }
    });

    // Preload images for smoother transitions
    preloadSliderImages(slidesData, isMobile);
}

/* -------------------------------------------------------------------------- */
/* ✅ IMAGE PRELOADING FOR SMOOTHER TRANSITIONS                               */
/* -------------------------------------------------------------------------- */
function preloadSliderImages(slidesData, isMobile) {
    slidesData.forEach(slide => {
        const img = new Image();
        img.src = isMobile ? slide.mobile : slide.desktop;
    });
}

/* -------------------------------------------------------------------------- */
/* ✅ GLOBAL SLIDER SETUP FUNCTION - Calls both sliders                       */
/* -------------------------------------------------------------------------- */
function setupAllOffers() {
    // 1. Initialize the TOP Slider (using original IDs)
    initializeSlider(
        topSlides,
        "offers-slider",
        "offers-prev",
        "offers-next",
        "offers-dots"
    );

    // 2. Initialize the BOTTOM Slider (using new unique IDs)
    initializeSlider(
        bottomSlides,
        "bottom-offers-slider",
        "bottom-offers-prev",
        "bottom-offers-next",
        "bottom-offers-dots"
    );
}

/* -------------------------------------------------------------------------- */
/* ✅ OPTIMIZED RESIZE HANDLER                                                */
/* -------------------------------------------------------------------------- */
let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setupAllOffers();
    }, 250); // Reduced from 400ms for faster response
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
/* INITIALIZE (UPDATED)                                                       */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const products = await loadProducts();
  renderGrid();
  setupSearch(products);
  setupAllOffers(); // Calls the function that initializes both sliders
  setupMobileNav();
  revealOnScroll();
});
