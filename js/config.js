window.DEENICE_CONFIG = {
  // 1. FIX FORMAT: Remove the '+' sign
  whatsappNumber: "254106590617", 
  currency: "KES",
  usdToKesRate: 135,
  shippingFlatUSD: 20,
  serviceFeePctUnder750: 0.035,
  serviceFeePctOver750: 0.045
};

// Initialize categories when config loads
document.addEventListener('DOMContentLoaded', function() {
  // Wait for categories manager to load
  setTimeout(() => {
    if (typeof categoriesManager !== 'undefined') {
      categoriesManager.updateNavigation();
    }
  }, 100);
});
// DEMO/PEGBOARD PROTECTION SYSTEM
(function() {
    console.log('🔒 Loading demo/pegboard protection...');
    
    const correctTitle = 'Deenice Finds - Premium Tech Gadgets, Phones & Accessories in Kenya';
    const correctStoreName = 'Deenice Finds';
    
    // 1. Clean localStorage on every load
    const badKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.toLowerCase().includes('demo') || 
            key.toLowerCase().includes('pegboard') ||
            key === 'storefront_mode' ||
            key === 'site_mode'
        )) {
            badKeys.push(key);
            localStorage.removeItem(key);
        }
    }
    
    if (badKeys.length > 0) {
        console.log('🗑️ Cleaned bad keys:', badKeys);
    }
    
    // 2. Force correct title
    document.title = correctTitle;
    
    // 3. Monitor and protect title
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
    
    console.log('✅ Demo/pegboard protection active');
})();
