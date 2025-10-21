// Blog Data
const blogs = [
    {
        id: 1,
        title: "Powerseed PS-A156: Best 10000 mAh Magnetic Wireless Power Bank for Travel & Outdoors 🚀",
        excerpt: "Tired of cable clutter and dead devices ruining your adventures? Meet the Powerseed PS-A156, the sleek, compact magnetic wireless power bank that's about to change how you travel.",
        content: `
            <h2>Experience True Freedom with Magnetic Wireless Charging 🧲</h2>
            <p>Forget fumbling with cords when you're trying to snap that perfect outdoor photo. The PS-A156 features innovative magnetic wireless charging. Simply place your compatible phone (or even your smart watch!) onto the pad, and click—you're charging. It's the ultimate set-it-and-forget-it charging experience, perfect for busy travelers and hikers who need to stay light and nimble.</p>
            
            <p>With a substantial 10,000 mAh Li-Polymer Battery and a max output of 38.5W, this little device packs enough punch to top up your essentials multiple times. The universal Type-C input and output mean you're always ready for the latest devices.</p>
            
            <h2>The Ultimate Outdoor Portable Charger: Design & Durability 🏕️</h2>
            <p>Let's be honest, most portable chargers are boring gray bricks. Not this one. Available in eye-catching combos like black+green and pink+white, the PS-A156 boasts a "high appearance level light" and a slim profile (68×108.6×23.6mm) that slips easily into a jeans pocket or backpack side pouch. At just 215g, it's the ideal companion for Outdoor Traveling.</p>
            
            <p>See Your Power: The clear LED Display means no more guessing games. You'll always know exactly how much juice is left before heading out.</p>
            
            <p>Built Tough: Constructed from durable ABS+PC material, this magnetic charger is designed to withstand the bumps and scrapes of outdoor life.</p>
            
            <h2>Safety First: Over-Charging Protection & Li-Polymer Quality 🛡️</h2>
            <p>When you're far from an outlet, the last thing you want is a faulty charger. Powerseed built the PS-A156 10000 mAh power bank with robust protection features. It's a private mold product, ensuring quality control from Guangdong, China.</p>
            
            <p>Key safety features include:</p>
            <ul>
                <li>Over-discharging Protection</li>
                <li>Short Circuit Protection</li>
                <li>Over-charging Protection</li>
                <li>Low Tension safeguards</li>
            </ul>
            
            <p>This ensures peace of mind that your devices and your charger are protected, allowing you to focus on your adventure.</p>
            
            <h2>Final Verdict: Ditch the Cables, Keep the Charge with Powerseed</h2>
            <p>The Powerseed PS-A156 isn't just an accessory; it's an essential piece of gear for anyone who values efficiency, aesthetics, and true portability. If you need a reliable 10000 mAh magnetic wireless power bank that's ready for anything, your search ends here.</p>
        `,
        image: "https://i.postimg.cc/zGzWBSLp/H752e9673ded14855b91e284d97ed781c-F.jpg",
        category: "reviews",
        date: "2024-01-15",
        readTime: "5 min read",
        author: "Deenice Team"
    },
    {
        id: 2,
        title: "Top 5 Must-Have Tech Accessories in 2024",
        excerpt: "Upgrade your tech game with these essential accessories that combine style and functionality for the modern user.",
        content: "Full blog content here...",
        image: "https://i.postimg.cc/NGRrkPRs/Hf7fb927b9b97487da96fbd5dd5bc6badx.jpg",
        category: "guides",
        date: "2024-01-10",
        readTime: "4 min read",
        author: "Deenice Team"
    },
    {
        id: 3,
        title: "How to Choose the Right Power Bank for Your Needs",
        excerpt: "A comprehensive guide to selecting the perfect power bank based on capacity, features, and your lifestyle requirements.",
        content: "Full blog content here...",
        image: "https://i.postimg.cc/D03nz6zL/Screenshot-2025-10-15-201118.png",
        category: "guides",
        date: "2024-01-05",
        readTime: "6 min read",
        author: "Deenice Team"
    },
    // Add more blog posts as needed
];

// Render Blogs
function renderBlogs(blogsToRender = blogs) {
    const blogGrid = document.getElementById('blog-grid');
    if (!blogGrid) return;
    
    blogGrid.innerHTML = '';
    
    blogsToRender.forEach(blog => {
        const blogCard = document.createElement('div');
        blogCard.className = 'blog-card';
        blogCard.setAttribute('data-category', blog.category);
        blogCard.innerHTML = `
            <img src="${blog.image}" alt="${blog.title}" class="blog-image">
            <div class="blog-content">
                <span class="blog-category-tag">${blog.category}</span>
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-excerpt">${blog.excerpt}</p>
                <div class="blog-meta">
                    <span class="blog-date">${formatDate(blog.date)}</span>
                    <span class="blog-read-time">${blog.readTime}</span>
                </div>
                <a href="blog-detail.html?id=${blog.id}" class="blog-read-more">Read More</a>
            </div>
        `;
        
        blogGrid.appendChild(blogCard);
    });
}

// Display Blog Detail
function displayBlogDetail(blog) {
    const blogArticle = document.getElementById('blog-article');
    const breadcrumb = document.getElementById('blog-breadcrumb');
    
    if (blogArticle && breadcrumb) {
        breadcrumb.textContent = blog.title;
        
        blogArticle.innerHTML = `
            <div class="blog-header">
                <span class="blog-category-tag">${blog.category}</span>
                <h1 class="blog-title">${blog.title}</h1>
                <div class="blog-meta">
                    <span>By ${blog.author}</span>
                    <span>${formatDate(blog.date)}</span>
                    <span>${blog.readTime}</span>
                </div>
            </div>
            <div class="blog-content">
                ${blog.content}
            </div>
        `;
        
        // Update page title
        document.title = `${blog.title} - Deenice Finds | Tech Blog`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', blog.excerpt);
        }
    }
}

// Load Related Blogs
function loadRelatedBlogs(currentBlog) {
    const relatedPosts = document.getElementById('related-posts');
    if (!relatedPosts) return;
    
    const relatedBlogs = blogs
        .filter(blog => blog.id !== currentBlog.id && blog.category === currentBlog.category)
        .slice(0, 3);
    
    if (relatedBlogs.length > 0) {
        let relatedHTML = '';
        relatedBlogs.forEach(blog => {
            relatedHTML += `
                <div class="blog-card">
                    <img src="${blog.image}" alt="${blog.title}" class="blog-image">
                    <div class="blog-content">
                        <span class="blog-category-tag">${blog.category}</span>
                        <h3 class="blog-title">${blog.title}</h3>
                        <p class="blog-excerpt">${blog.excerpt}</p>
                        <div class="blog-meta">
                            <span class="blog-date">${formatDate(blog.date)}</span>
                            <span class="blog-read-time">${blog.readTime}</span>
                        </div>
                        <a href="blog-detail.html?id=${blog.id}" class="blog-read-more">Read More</a>
                    </div>
                </div>
            `;
        });
        relatedPosts.innerHTML = relatedHTML;
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize blogs on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a blog detail page
    if (window.location.pathname.includes('blog-detail.html')) {
        loadBlogDetail();
    } else {
        // Render all blogs on blogs page
        renderBlogs();
    }
    
    // Render featured blogs on home page
    const featuredBlogs = document.getElementById('featured-blogs');
    if (featuredBlogs) {
        const featuredBlogsData = blogs.slice(0, 3);
        let featuredHTML = '';
        featuredBlogsData.forEach(blog => {
            featuredHTML += `
                <div class="blog-card">
                    <img src="${blog.image}" alt="${blog.title}" class="blog-image">
                    <div class="blog-content">
                        <span class="blog-category-tag">${blog.category}</span>
                        <h3 class="blog-title">${blog.title}</h3>
                        <p class="blog-excerpt">${blog.excerpt}</p>
                        <div class="blog-meta">
                            <span class="blog-date">${formatDate(blog.date)}</span>
                            <span class="blog-read-time">${blog.readTime}</span>
                        </div>
                        <a href="blog-detail.html?id=${blog.id}" class="blog-read-more">Read More</a>
                    </div>
                </div>
            `;
        });
        featuredBlogs.innerHTML = featuredHTML;
    }
});