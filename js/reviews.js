// Reviews Data
const reviews = [
    {
        id: 1,
        customerName: "Sarah M.",
        rating: 5,
        date: "2024-01-15",
        product: "Magsafe Battery Pack 10,000Mah",
        review: "Absolutely love this power bank! The magnetic feature is a game-changer and it charges my phone incredibly fast. The build quality is premium and it's perfect for travel. Highly recommended!",
        verified: true
    },
    {
        id: 2,
        customerName: "James K.",
        rating: 5,
        date: "2024-01-12",
        product: "Wireless Earbuds Pro",
        review: "Best earbuds I've ever owned! The noise cancellation is incredible and battery life lasts through my entire workday. Deenice Finds provided excellent service and fast delivery.",
        verified: true
    },
    {
        id: 3,
        customerName: "Linda W.",
        rating: 4,
        date: "2024-01-10",
        product: "iPhone 15 Pro Case",
        review: "Great quality case with perfect fit. The MagSafe works perfectly and the protection seems solid. Only giving 4 stars because I wish there were more color options.",
        verified: true
    },
    {
        id: 4,
        customerName: "Mike T.",
        rating: 5,
        date: "2024-01-08",
        product: "Buy For Me Service - US Laptop",
        review: "Used the Buy For Me service for a laptop from the US. The process was smooth, pricing was transparent, and delivery was exactly as promised. Will definitely use this service again!",
        verified: true
    },
    {
        id: 5,
        customerName: "Grace A.",
        rating: 5,
        date: "2024-01-05",
        product: "Power Bank & Phone Case Bundle",
        review: "Excellent customer service! The team helped me choose the right products and the delivery was faster than expected. Products are authentic and work perfectly.",
        verified: true
    },
    {
        id: 6,
        customerName: "Robert N.",
        rating: 4,
        date: "2024-01-03",
        product: "Smart Watch Series 5",
        review: "Good quality watch with all the features I needed. Delivery was prompt and packaging was secure. The health tracking features are accurate and useful.",
        verified: true
    },
    {
        id: 7,
        customerName: "Patricia L.",
        rating: 5,
        date: "2023-12-28",
        product: "Multiple Accessories",
        review: "I've ordered multiple times from Deenice Finds and they never disappoint. Products are always authentic, prices are fair, and customer service is outstanding.",
        verified: true
    },
    {
        id: 8,
        customerName: "David M.",
        rating: 5,
        date: "2023-12-25",
        product: "Wireless Charging Pad",
        review: "Fast charging and reliable. Works perfectly with my phone and the design is sleek. Much better than other charging pads I've tried before.",
        verified: true
    }
];

// Render Reviews
function renderReviews(reviewsToRender = reviews) {
    const reviewsGrid = document.getElementById('reviews-grid');
    if (!reviewsGrid) return;
    
    reviewsGrid.innerHTML = '';
    
    reviewsToRender.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.setAttribute('data-rating', review.rating);
        reviewCard.setAttribute('data-verified', review.verified);
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <h4>${review.customerName}</h4>
                    <div class="review-date">${formatDate(review.date)}</div>
                    <div class="review-rating">${stars}</div>
                </div>
                ${review.verified ? '<div class="verified-badge">✓ Verified Purchase</div>' : ''}
            </div>
            <div class="review-product">Product: ${review.product}</div>
            <div class="review-text">${review.review}</div>
        `;
        
        reviewsGrid.appendChild(reviewCard);
    });
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Filter reviews
function filterReviews(filter) {
    let filteredReviews = reviews;
    
    if (filter === '5') {
        filteredReviews = reviews.filter(review => review.rating === 5);
    } else if (filter === '4') {
        filteredReviews = reviews.filter(review => review.rating === 4);
    } else if (filter === '3') {
        filteredReviews = reviews.filter(review => review.rating === 3);
    } else if (filter === 'verified') {
        filteredReviews = reviews.filter(review => review.verified);
    }
    
    renderReviews(filteredReviews);
}

// Initialize reviews on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reviews.html')) {
        renderReviews();
        
        // Add filter functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                filterReviews(this.getAttribute('data-filter'));
            });
        });
        
        // Add FAQ functionality
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });
    }
});