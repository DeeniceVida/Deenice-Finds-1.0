// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Handle category filtering
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active state
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            filterProducts(category);
        });
    });

    // Handle blog category filtering
    const blogCategories = document.querySelectorAll('.blog-category');
    blogCategories.forEach(category => {
        category.addEventListener('click', function() {
            const blogCategory = this.getAttribute('data-category');
            
            // Update active state
            blogCategories.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Filter blog posts
            filterBlogPosts(blogCategory);
        });
    });

    // Handle search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProductsBySearch(searchTerm);
        });
    }

    // Handle URL parameters for category filtering
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        // Activate corresponding category filter
        const categoryFilter = document.querySelector(`[data-category="${category}"]`);
        if (categoryFilter) {
            categoryFilter.click();
        }
    }
});

// Filter products by category
function filterProducts(category) {
    const productsGrid = document.getElementById('products-grid');
    const allProducts = productsGrid.querySelectorAll('.product-card');
    
    allProducts.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        
        if (category === 'all' || productCategory === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Filter products by search term
function filterProductsBySearch(searchTerm) {
    const productsGrid = document.getElementById('products-grid');
    const allProducts = productsGrid.querySelectorAll('.product-card');
    
    allProducts.forEach(product => {
        const productName = product.querySelector('.product-name').textContent.toLowerCase();
        const productDescription = product.querySelector('.product-description').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Filter blog posts by category
function filterBlogPosts(category) {
    const blogGrid = document.getElementById('blog-grid');
    const allPosts = blogGrid.querySelectorAll('.blog-card');
    
    allPosts.forEach(post => {
        const postCategory = post.getAttribute('data-category');
        
        if (category === 'all' || postCategory === category) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
}

// Load product detail from URL parameter
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId && window.products) {
        const product = window.products.find(p => p.id == productId);
        if (product) {
            displayProductDetail(product);
            loadRelatedProducts(product);
        }
    }
}

// Load blog detail from URL parameter
function loadBlogDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    
    if (blogId && window.blogs) {
        const blog = window.blogs.find(b => b.id == blogId);
        if (blog) {
            displayBlogDetail(blog);
            loadRelatedBlogs(blog);
        }
    }
}