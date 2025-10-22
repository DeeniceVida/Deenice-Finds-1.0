
(async function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const res = await fetch('data/products.json');
  const data = await res.json();
  const p = data.find(x=>x.id===id) || data[0];
  const container = document.getElementById('product-page');
  container.innerHTML = `
    <div class="product-page-card">
      <div class="product-slideshow">
        <div class="product-main"><img id="main-image" src="${p.images[0]}" alt="${p.title}" style="width:100%;border-radius:12px"/></div>
        <div class="product-thumbs">
          ${p.images.map((im,idx)=>`<img data-src="${im}" ${idx===0?'class="selected"':''} src="${im}" />`).join('')}
        </div>
      </div>
      <h2>${p.title}</h2>
      <div class="price">${p.price.toLocaleString()} ${p.currency}</div>
      <p><em>${p.description}</em></p>
      <div class="select-colors">
        ${p.colors.map((c,idx)=>`<div class="color-swatch ${idx===0?'selected':''}" data-img="${c.img}" data-name="${c.name}">${c.name[0]}<img class="preview" src="${c.img}"></div>`).join('')}
      </div>
      <label>Quantity: <input id="qty" type="number" value="1" min="1" max="${p.stock}" /></label>
      <button id="add-cart" class="primary">Add to Cart</button>
    </div>
  `;

  document.querySelectorAll('.product-thumbs img').forEach(img=>{
    img.addEventListener('click', ()=>{
      document.getElementById('main-image').src = img.dataset.src;
      document.querySelectorAll('.product-thumbs img').forEach(i=>i.classList.remove('selected'));
      img.classList.add('selected');
    });
  });

  document.querySelectorAll('.color-swatch').forEach(s=>{
    s.addEventListener('click', ()=>{
      document.querySelectorAll('.color-swatch').forEach(x=>{ x.classList.remove('selected'); const pr = x.querySelector('img.preview'); if(pr) pr.style.display='none'; });
      s.classList.add('selected');
      const img = s.dataset.img;
      const pr = s.querySelector('img.preview');
      if(pr){ pr.src = img; pr.style.display='block'; }
      document.getElementById('main-image').src = img;
    });
    // show preview for default selected
    const prd = s.querySelector('img.preview');
    if(s.classList.contains('selected') && prd) prd.style.display='block';
  });

  document.getElementById('add-cart').addEventListener('click', ()=>{
    const qty = Number(document.getElementById('qty').value||1);
    const color = document.querySelector('.color-swatch.selected').dataset.name;
    const cart = JSON.parse(localStorage.getItem('de_cart')||'[]');
    cart.push({id:p.id,title:p.title,price:p.price,currency:p.currency,qty,color});
    localStorage.setItem('de_cart', JSON.stringify(cart));
    alert('Added to cart');
    const badge = document.getElementById('cart-count');
    if(badge) badge.textContent = cart.length;
  });
})();
