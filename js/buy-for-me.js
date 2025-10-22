
document.addEventListener('DOMContentLoaded', ()=>{
  const priceInput = document.getElementById('bfm-price');
  const linkInput = document.getElementById('bfm-link');
  const results = document.getElementById('bfm-results');
  const sendBtn = document.getElementById('bfm-send');

  function compute(){
    const priceUSD = Number(priceInput.value||0);
    const cfg = window.DEENICE_CONFIG;
    const servicePct = priceUSD > 750 ? cfg.serviceFeePctOver750 : cfg.serviceFeePctUnder750;
    const shippingFee = cfg.shippingFlatUSD + (priceUSD * cfg.serviceFeePctUnder750);
    const serviceFee = priceUSD > 750 ? (priceUSD * cfg.serviceFeePctOver750) : (priceUSD * cfg.serviceFeePctUnder750);
    const totalUSD = priceUSD + shippingFee + serviceFee;
    const totalKES = Math.round(totalUSD * cfg.usdToKesRate);
    results.innerHTML = `<p>Price (USD): $${priceUSD.toFixed(2)}</p><p>Shipping estimate: $${shippingFee.toFixed(2)}</p><p>Service fee: $${serviceFee.toFixed(2)}</p><p><strong>Total est: KES ${totalKES.toLocaleString()}</strong></p><p>Delivery: 3 weeks</p>`;
    return {priceUSD,shippingFee,serviceFee,totalUSD,totalKES};
  }
  if(priceInput) priceInput.addEventListener('input', compute);
  if(sendBtn) sendBtn.addEventListener('click', ()=>{
    const link = linkInput.value || '';
    const c = compute();
    const cfg = window.DEENICE_CONFIG;
    const txt = encodeURIComponent(`BuyForMe order:\nLink: ${link}\nPrice(USD): $${c.priceUSD.toFixed(2)}\nShipping(USD): $${c.shippingFee.toFixed(2)}\nService(USD): $${c.serviceFee.toFixed(2)}\nTotal(KES): ${c.totalKES}`);
    window.open(`https://wa.me/${cfg.whatsappNumber.replace('+','')}?text=${txt}`,'_blank');
  });
});
