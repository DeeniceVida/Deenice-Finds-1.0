
const PRODUCTS = [
  {
    id: 1,
    title: "Magsafe Battery pack 10,000mAh",
    price: 3900,
    currency: "KES",
    usd: 29,
    description: "Portable Magnetic Wireless Power Bank (10000 mAh)",
    images: [
      "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg",
      "https://i.postimg.cc/D03nz6zL/Screenshot-2025-10-15-201118.png",
      "https://i.postimg.cc/RZpmt4Fx/image.png",
      "https://i.postimg.cc/kgHr4s1R/image.png",
      "https://i.postimg.cc/V6LXV9wM/image.png"
    ],
    colors: [
      {name:"White", img:"https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg"},
      {name:"Black", img:"https://i.postimg.cc/NGRrkPRs/Hf7fb927b9b97487da96fbd5dd5bc6badx.jpg"},
      {name:"Green (demo)", img:"https://via.placeholder.com/240x240?text=Green"},
      {name:"Pink (demo)", img:"https://via.placeholder.com/240x240?text=Pink"}
    ],
    sku: "PS-A156",
    short: "High capacity magnetic power bank."
  }
];

for(let i=2;i<=10;i++){
  const p = JSON.parse(JSON.stringify(PRODUCTS[0]));
  p.id = i;
  p.title = `Demo Product ${i} — Case / Accessory`;
  p.sku = `DEMO-${i}`;
  p.price = 1500 + i*120;
  p.usd = Math.round((p.price/135)*100)/100;
  p.description = "High quality demo product listing. Replace images and text in products.js";
  PRODUCTS.push(p);
}

function renderProducts(){
  const grid=document.getElementById('productsGrid');
  PRODUCTS.forEach(p=>{
    const card=document.createElement('a');
    card.className='card';
    card.href='product.html?id='+p.id;
    card.innerHTML = `
      <img loading="lazy" src="${p.images[0]}" alt="${p.title}">
      <div class="title">${p.title}</div>
      <div class="price">KES ${p.price.toLocaleString()}</div>
      <div class="short">${p.short || ''}</div>
    `;
    grid.appendChild(card);
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  renderProducts();
});
