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
