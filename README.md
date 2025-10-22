# Deenice Finds — Static Website (GitHub Pages)
Premium responsive landing/ecommerce demo for *Deenice Finds* — "Plugged By the Best"

**What you get**
- Fully responsive static site (HTML/CSS/JS) ready for GitHub Pages.
- Header with dropdowns, search with suggestions, product grid, product detail pages, blog, calculator, compare, cart and WhatsApp order integration.
- Tidio chat embedded.
- All adjustable content lives in `data/products.json` and `js/config.js` (see comments).

**How to deploy**
1. Unzip and push the folder to a GitHub repository branch `gh-pages` or `main`.
2. Enable GitHub Pages for the repo (use root).
3. Assets like logos are referenced by URL — replace with your hosted images if you want them locally.

**Where to edit**
- `data/products.json` — product listings (images, prices, colors, descriptions).
- `js/config.js` — site-wide config (WhatsApp number, currency, exchange rate, calculator rules).
- `css/styles.css` — design tweaks (colors, radii, spacing).
- `index.html` / `products.html` / `product.html` etc.

**Notes & TODOs**
- Font: uses system SF Pro stack (SF Pro is proprietary; host the font yourself if licensed).
- Image optimization: images are referenced by URL to keep package small. Replace with local images in `assets/` if desired.
- Make sure to update `js/config.js` with your WhatsApp number and any rates.

