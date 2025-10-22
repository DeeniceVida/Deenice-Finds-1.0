
(async function(){
  const grid = document.getElementById('product-grid');
  const res = await fetch('data/products.json');
  const data = await res.json();
  data.forEach(p=>{
    const el = document.createElement('a');
    el.className='product-card';
    el.href = `product.html?id=${encodeURIComponent(p.id)}`;
    el.innerHTML = `<img src="${p.images[0]}" alt="${p.title}"/><h3>${p.title}</h3><div class="price">${p.price.toLocaleString()} ${p.currency}</div>`;
    grid.appendChild(el);
  });
})();
