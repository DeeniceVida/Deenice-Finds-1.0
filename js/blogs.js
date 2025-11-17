const blogs = [
    // 📢 NEW BLOG POST (Appears first on the blog page)
    { 
        title: "Why Your New Phone Box Feels Empty (No Charger? No Earphones? Here’s Why!)", 
        slug: "phone-box-empty-no-charger-reason", 
        excerpt: "The latest phones often skip the charger and earphones. Is it truly about saving the planet, or is there a hidden business advantage? We break down the 'eco-friendly' claims and the real costs to you." 
    },
    // EXISTING POST
    { 
        title: "Powerseed PS-A156: Best 10000 mAh Magnetic Wireless Power Bank for Travel & Outdoors 🚀", 
        slug: "powerseed-ps-a156-review", 
        excerpt: "Tired of cable clutter and dead devices ruining your adventures? Meet the Powerseed PS-A156..." 
    },
    { 
  title: "10 Signs You Should NOT Buy That TV (Before You Regret It!)", 
  slug: "tv-buying-red-flags-signs-to-avoid", 
  excerpt: "Before buying a new TV, look out for these 10 red flags that most shoppers miss. Avoid these mistakes and choose the right screen for your home." 
}
];

const container = document.getElementById('blogs');
if(container) blogs.forEach(b=>{ 
    const el=document.createElement('article'); 
    el.innerHTML=`<h2>${b.title}</h2><p>${b.excerpt}</p><a href='blog-${b.slug}.html'>Read More</a>`; 
    container.appendChild(el); 
});
