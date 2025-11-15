window.DEENICE_CONFIG = {
  whatsappNumber: "254106590617", 
  currency: "KES",
  usdToKesRate: 135,
  shippingFlatUSD: 20,
  serviceFeePctUnder750: 0.035,
  serviceFeePctOver750: 0.045
};

// AUTO-CACHE REFRESH SYSTEM
(function() {
    const CACHE_VERSION = '2.0'; // Increment this when you update products
    
    console.log('🔒 Loading cache management system...');
    
    // Check if we need to refresh cache
    const lastCacheVersion = localStorage.getItem('cache_version');
    if (lastCacheVersion !== CACHE_VERSION) {
        console.log('🔄 Refreshing product cache from version', lastCacheVersion, 'to', CACHE_VERSION);
        localStorage.removeItem('storefront_products');
        localStorage.removeItem('inventory_products');
        localStorage.removeItem('storefront_products_updated');
        localStorage.setItem('cache_version', CACHE_VERSION);
        console.log('✅ Cache refreshed to version:', CACHE_VERSION);
    }
    
    const correctTitle = 'Deenice Finds - Premium Tech Gadgets, Phones & Accessories in Kenya';
    
    // Force correct title
    document.title = correctTitle;
    
    // Monitor and protect title
    const titleObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.nodeName === 'TITLE' && document.title !== correctTitle) {
                console.log('🚨 Title protection: Blocked change to', document.title);
                document.title = correctTitle;
            }
        });
    });
    
    if (document.querySelector('title')) {
        titleObserver.observe(document.querySelector('title'), { 
            subtree: true,
            characterData: true,
            childList: true
        });
    }
    
    console.log('✅ Cache management system active');
})();

// Initialize categories when config loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof categoriesManager !== 'undefined') {
            categoriesManager.updateNavigation();
        }
    }, 100);
});
