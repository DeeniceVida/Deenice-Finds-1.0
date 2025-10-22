
const blogs = [
  { title: "Powerseed PS-A156: Best 10000 mAh Magnetic Wireless Power Bank for Travel & Outdoors 🚀", slug:"powerseed-ps-a156-review", excerpt:"Tired of cable clutter and dead devices ruining your adventures? Meet the Powerseed PS-A156..." }
];
const container = document.getElementById('blogs');
if(container) blogs.forEach(b=>{ const el=document.createElement('article'); el.innerHTML=`<h2>${b.title}</h2><p>${b.excerpt}</p><a href='blog-${b.slug}.html'>Read More</a>`; container.appendChild(el); });
