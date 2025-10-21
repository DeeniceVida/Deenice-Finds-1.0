// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeHeroSlider();
    setupEventListeners();
    initializePageSpecificFunctions();
});

// Initialize Hero Slider
function initializeHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    
    if (!slides.length) return;
    
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        if (dots[index]) {
            dots[index].classList.add('active');
        }
        
        currentSlide = index;
    }
    
    function nextSlide() {
        let nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    function prevSlide() {
        let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
    
    // Auto advance slides
    function startSlideShow() {
        slideInterval = setInterval(nextSlide, 6000);
    }
    
    function stopSlideShow() {
        clearInterval(slideInterval);
    }
    
    // Event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopSlideShow();
            prevSlide();
            startSlideShow();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopSlideShow();
            nextSlide();
            startSlideShow();
        });
    }
    
    if (dots.length) {
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopSlideShow();
                showSlide(index);
                startSlideShow();
            });
        });
    }
    
    // Pause on hover
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        heroSlider.addEventListener('mouseenter', stopSlideShow);
        heroSlider.addEventListener('mouseleave', startSlideShow);
    }
    
    startSlideShow();
    showSlide(currentSlide);
}

// Setup Event Listeners
function setupEventListeners() {
    // Cart toggle
    const cartIcon = document.getElementById('cart-icon');
    const cartClose = document.getElementById('cart-close');
    const overlay = document.getElementById('overlay');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeCart);
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileNavClose && mobileNav) {
        mobileNavClose.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    // Mobile dropdowns
    const mobileProductsBtn = document.getElementById('mobile-products-btn');
    const mobileServicesBtn = document.getElementById('mobile-services-btn');
    
    if (mobileProductsBtn) {
        mobileProductsBtn.addEventListener('click', function() {
            const dropdown = document.getElementById('mobile-products-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }
    
    if (mobileServicesBtn) {
        mobileServicesBtn.addEventListener('click', function() {
            const dropdown = document.getElementById('mobile-services-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }
    
    // Search toggle
    const searchIcon = document.querySelector('.search-icon');
    const searchBar = document.querySelector('.search-bar');
    
    if (searchIcon && searchBar) {
        searchIcon.addEventListener('click', function() {
            searchBar.classList.toggle('active');
        });
        
        // Close search when clicking outside
        document.addEventListener('click', function(event) {
            if (!searchIcon.contains(event.target) && !searchBar.contains(event.target)) {
                searchBar.classList.remove('active');
            }
        });
    }
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProductsBySearch(searchTerm);
        });
        
        // Search suggestions
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function() {
                const searchText = this.getAttribute('data-search');
                if (searchInput) {
                    searchInput.value = searchText;
                    filterProductsBySearch(searchText);
                }
            });
        });
    }
    
    // Buy For Me Calculator
    setupCalculator();
    
    // FAQ functionality
    setupFAQ();
}

// Initialize Page Specific Functions
function initializePageSpecificFunctions() {
    // Check if we're on a specific page and run appropriate functions
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'services.html':
            setupServicesPage();
            break;
        case 'contact.html':
            setupContactPage();
            break;
        case 'reviews.html':
            // Reviews functionality is handled in reviews.js
            break;
        case 'help.html':
            setupHelpPage();
            break;
    }
}

// Buy For Me Calculator Setup
function setupCalculator() {
    const productPriceInput = document.getElementById('product-price');
    const calculatorSubmit = document.getElementById('calculator-submit');
    
    // Calculate price in real-time
    if (productPriceInput) {
        productPriceInput.addEventListener('input', calculateQuote);
    }
    
    // Calculator submit
    if (calculatorSubmit) {
        calculatorSubmit.addEventListener('click', function() {
            const productLink = document.getElementById('product-link')?.value;
            const productPrice = parseFloat(document.getElementById('product-price')?.value);
            
            if (!productLink || !productPrice) {
                alert('Please fill in both the product link and price');
                return;
            }
            
            calculateQuote();
            
            const resultProductPrice = document.getElementById('result-product-price')?.textContent;
            const resultExchange = document.getElementById('result-exchange')?.textContent;
            const resultShipping = document.getElementById('result-shipping')?.textContent;
            const resultService = document.getElementById('result-service')?.textContent;
            const resultTotal = document.getElementById('result-total')?.textContent;
            
            const message = `Hello! I'm interested in your "Buy For Me" service.%0A%0AProduct Link: ${productLink}%0AProduct Price: ${resultProductPrice}%0AExchange Rate: ${resultExchange}%0AShipping Fee: ${resultShipping}%0AService Fee: ${resultService}%0ATotal Cost: ${resultTotal}%0A%0AI agree with the quote and would like to proceed.`;
            
            window.open(`https://wa.me/254106590617?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
    
    // Buy For Me navigation
    const buyForMeButtons = [
        document.getElementById('buy-for-me-btn'),
        document.getElementById('mobile-buy-for-me-btn'),
        document.getElementById('footer-buy-for-me-btn')
    ];
    
    buyForMeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const calculatorSection = document.getElementById('calculator-section');
                if (calculatorSection) {
                    calculatorSection.scrollIntoView({ behavior: 'smooth' });
                }
                // Close mobile nav if applicable
                const mobileNav = document.getElementById('mobile-nav');
                if (mobileNav) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
}

// Calculate Quote
function calculateQuote() {
    const productPrice = parseFloat(document.getElementById('product-price')?.value) || 0;
    const exchangeRate = 135;
    
    // Calculate costs
    const productPriceKES = productPrice * exchangeRate;
    let shippingFee = 0;
    let serviceFee = 0;
    
    if (productPrice <= 750) {
        shippingFee = 20 * exchangeRate + (0.035 * productPrice * exchangeRate);
        serviceFee = 30 * exchangeRate;
    } else {
        shippingFee = 20 * exchangeRate + (0.035 * productPrice * exchangeRate);
        serviceFee = 0.045 * productPrice * exchangeRate;
    }
    
    const totalCost = productPriceKES + shippingFee + serviceFee;
    
    // Update UI
    const resultProductPrice = document.getElementById('result-product-price');
    const resultExchange = document.getElementById('result-exchange');
    const resultShipping = document.getElementById('result-shipping');
    const resultService = document.getElementById('result-service');
    const resultTotal = document.getElementById('result-total');
    const calculatorResult = document.getElementById('calculator-result');
    
    if (resultProductPrice) {
        resultProductPrice.textContent = `$${productPrice.toFixed(2)}`;
    }
    if (resultExchange) {
        resultExchange.textContent = `KES ${productPriceKES.toLocaleString()}`;
    }
    if (resultShipping) {
        resultShipping.textContent = `KES ${Math.round(shippingFee).toLocaleString()}`;
    }
    if (resultService) {
        resultService.textContent = `KES ${Math.round(serviceFee).toLocaleString()}`;
    }
    if (resultTotal) {
        resultTotal.textContent = `KES ${Math.round(totalCost).toLocaleString()}`;
    }
    if (calculatorResult) {
        calculatorResult.style.display = 'block';
    }
}

// FAQ Setup
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

// Services Page Setup
function setupServicesPage() {
    // Smooth scroll to sections
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Contact Page Setup
function setupContactPage() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!data.name || !data.email || !data.subject || !data.message) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Prepare WhatsApp message
            const message = `New Contact Form Submission%0A%0AName: ${data.name}%0AEmail: ${data.email}%0APhone: ${data.phone || 'Not provided'}%0ASubject: ${data.subject}%0AMessage: ${data.message}`;
            
            // Send via WhatsApp
            window.open(`https://wa.me/254106590617?text=${encodeURIComponent(message)}`, '_blank');
            
            // Reset form
            this.reset();
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
        });
    }
    
    // Pre-fill subject if coming from specific links
    const urlParams = new URLSearchParams(window.location.search);
    const subject = urlParams.get('subject');
    if (subject) {
        const subjectSelect = document.getElementById('subject');
        if (subjectSelect) {
            subjectSelect.value = subject;
        }
    }
}

// Help Page Setup
function setupHelpPage() {
    // Help category navigation
    const categoryLinks = document.querySelectorAll('.category-link');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Filter products by search term
function filterProductsBySearch(searchTerm) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const allProducts = productsGrid.querySelectorAll('.product-card');
    
    allProducts.forEach(product => {
        const productName = product.querySelector('.product-name')?.textContent.toLowerCase() || '';
        const productDescription = product.querySelector('.product-description')?.textContent.toLowerCase() || '';
        
        if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Open Cart
function openCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (cartSidebar) {
        cartSidebar.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
}

// Close Cart
function closeCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

// Utility function to format currency
function formatCurrency(amount, currency = 'KES') {
    return `${currency} ${amount.toLocaleString()}`;
}

// Utility function to debounce rapid function calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other files
window.openCart = openCart;
window.closeCart = closeCart;
window.formatCurrency = formatCurrency;