const blogs = [
    // ** NEW BLOG POST - COPY THIS OBJECT AND ADD IT TO THE TOP **
    { 
        title: "Why Your New Phone Box Feels Empty (No Charger? No Earphones? Here’s Why!)", 
        slug: "phone-box-empty-no-charger-reason", // This slug creates the link
        excerpt: "The latest phones often skip the charger and earphones. Is it truly about saving the planet, or is there a hidden business advantage? We break down the 'eco-friendly' claims and the real costs to you." 
    },
    // Existing Posts
    { 
        title: "Powerseed PS-A156: Best 10000 mAh Magnetic Wireless Power Bank for Travel & Outdoors 🚀", 
        slug: "powerseed-ps-a156-review", 
        excerpt: "Tired of cable clutter and dead devices ruining your adventures? Meet the Powerseed PS-A156..." 
    }
];
// ... (The rest of the code remains the same)
const container = document.getElementById('blogs');
if(container) blogs.forEach(b=>{ const el=document.createElement('article'); el.innerHTML=`<h2>${b.title}</h2><p>${b.excerpt}</p><a href='blog-${b.slug}.html'>Read More</a>`; container.appendChild(el); });
