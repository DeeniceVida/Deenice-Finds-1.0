class InventoryManager {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderInventory();
        this.setupEventListeners();
        this.setupModalHandlers();
    }

    // 🟢 ENHANCED: Load products with persistence
    async loadProducts() {
        try {
            console.log('📥 Loading products...');
            
            // Try to load from localStorage first (admin modifications)
            const savedProducts = localStorage.getItem('inventory_products');
            
            if (savedProducts) {
                this.products = JSON.parse(savedProducts);
                console.log('✅ Loaded products from localStorage:', this.products.length);
                return;
            }
            
            // Fallback to original JSON file
            console.log('📥 No saved products, loading from JSON file...');
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            const productsData = await response.json();
            
            this.products = productsData.map(product => ({
                id: product.id,
                name: product.title,
                price: product.price,
                stock: product.stock || 0,
                category: product.category,
                image: product.images ? product.images[0] : '',
                description: product.description,
                colors: product.colors || [],
                colorStock: product.colorStock || this.initializeColorStock(product.colors, product.stock),
                availableColors: product.availableColors || (product.colors ? product.colors.map(color => color.name) : []),
                originalData: product
            }));
            
            console.log('✅ Loaded products from JSON:', this.products.length);
            
            // Save initial load to localStorage
            await this.saveToBackend();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please check the console for details.');
            this.products = [];
        }
    }

    // 🟢 ENHANCED: Save inventory changes persistently
    async saveToBackend() {
        try {
            console.log('💾 Saving inventory changes...');
            
            // Save to localStorage for immediate access
            localStorage.setItem('inventory_products', JSON.stringify(this.products));
            
            // Also save to a backup in case localStorage gets cleared
            localStorage.setItem('inventory_last_updated', new Date().toISOString());
            
            console.log('✅ Inventory saved successfully:', this.products.length, 'products');
            
            // Update the main products.json in localStorage for the storefront
            this.updateStorefrontProducts();
            
            return true;
        } catch (error) {
            console.error('❌ Error saving inventory:', error);
            throw error;
        }
    }

    // 🟢 NEW: Update storefront products with current inventory
    updateStorefrontProducts() {
        try {
            // Create storefront-compatible product data
            const storefrontProducts = this.products.map(product => {
                const totalStock = product.colorStock ? 
                    Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 
                    product.stock || 0;
                    
                return {
                    id: product.id,
                    title: product.name,
                    price: product.price,
                    originalPrice: product.originalData?.originalPrice,
                    currency: product.originalData?.currency || 'KES',
                    description: product.description,
                    images: product.originalData?.images || [product.image],
                    colors: product.colors,
                    sizes: product.originalData?.sizes,
                    models: product.originalData?.models,
                    specs: product.originalData?.specs,
                    available_status: product.originalData?.available_status,
                    sku: product.originalData?.sku,
                    stock: totalStock, // Use calculated total stock
                    category: product.category,
                    colorStock: product.colorStock,
                    availableColors: product.availableColors
                };
            });
            
            // Save to localStorage for storefront to use
            localStorage.setItem('storefront_products', JSON.stringify(storefrontProducts));
            localStorage.setItem('storefront_products_updated', new Date().toISOString());
            
            console.log('🔄 Storefront products updated:', storefrontProducts.length);
            
        } catch (error) {
            console.error('Error updating storefront products:', error);
        }
    }

    // 🟢 NEW: Force refresh from source
    async refreshFromSource() {
        try {
            if (confirm('This will reload products from the original JSON file and overwrite any changes. Continue?')) {
                // Clear saved products
                localStorage.removeItem('inventory_products');
                localStorage.removeItem('storefront_products');
                
                // Reload from JSON
                await this.loadProducts();
                this.renderInventory();
                this.showSuccess('Products refreshed from source!');
            }
        } catch (error) {
            console.error('Error refreshing from source:', error);
            this.showError('Failed to refresh products.');
        }
    }

    initializeColorStock(colors, totalStock) {
        if (!colors || colors.length === 0) return {};
        
        const colorStock = {};
        const stockPerColor = Math.floor(totalStock / colors.length);
        const remainder = totalStock % colors.length;
        
        colors.forEach((color, index) => {
            colorStock[color.name] = stockPerColor + (index < remainder ? 1 : 0);
        });
        
        return colorStock;
    }

    renderInventory() {
        const tbody = document.getElementById('inventoryBody');
        if (!tbody) {
            console.error('Inventory table body not found');
            return;
        }

        tbody.innerHTML = '';

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        No products found. Click "Add New Product" to get started.
                    </td>
                </tr>
            `;
            return;
        }

        this.products.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
    }

    createProductRow(product) {
        const row = document.createElement('tr');
        const totalColorStock = product.colorStock ? Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 0;
        const status = this.getStockStatus(totalColorStock);
        const availableColorsCount = product.availableColors ? product.availableColors.length : 0;
        const totalColorsCount = product.colors ? product.colors.length : 0;
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" class="product-thumb" onerror="this.style.display='none'">` : 
                    '<div style="width:50px;height:50px;background:#f8f9fa;display:flex;align-items:center;justify-content:center;border-radius:4px;color:#6c757d;font-size:12px;">No Image</div>'
                }
            </td>
            <td>${this.escapeHtml(product.name)}</td>
            <td>${this.escapeHtml(product.category)}</td>
            <td>KES ${parseFloat(product.price).toFixed(2)}</td>
            <td>${totalColorStock}</td>
            <td>
                <span class="status ${status}">${this.formatStatusText(status)}</span>
            </td>
            <td>
                <span class="color-status" title="${availableColorsCount} of ${totalColorsCount} colors available">
                    ${availableColorsCount}/${totalColorsCount} Colors
                </span>
            </td>
            <td class="actions">
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="colors-btn" data-id="${product.id}">Stock</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </td>
        `;
        return row;
    }

    getStockStatus(stock) {
        if (stock > 10) return 'in-stock';
        if (stock > 0) return 'low-stock';
        return 'out-of-stock';
    }

    formatStatusText(status) {
        const statusMap = {
            'in-stock': 'In Stock',
            'low-stock': 'Low Stock',
            'out-of-stock': 'Out of Stock'
        };
        return statusMap[status] || 'Unknown';
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    setupEventListeners() {
        // Add product button
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        // 🟢 NEW: Refresh products button
        const refreshBtn = document.getElementById('refreshProductsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshFromSource();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInventory');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Edit/Delete/Colors buttons (event delegation)
        const tbody = document.getElementById('inventoryBody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('edit-btn')) {
                    this.editProduct(target.dataset.id);
                }
                if (target.classList.contains('colors-btn')) {
                    this.manageColorStock(target.dataset.id);
                }
                if (target.classList.contains('delete-btn')) {
                    this.deleteProduct(target.dataset.id);
                }
            });
        }
    }

    setupModalHandlers() {
        // Product modal handlers
        const productModal = document.getElementById('productModal');
        const productCloseBtn = productModal.querySelector('.close');
        const productForm = document.getElementById('productForm');

        if (productCloseBtn) {
            productCloseBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (productModal) {
            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    this.closeModal();
                }
            });
        }

        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Colors modal handlers
        const colorsModal = document.getElementById('colorsModal');
        const colorsCloseBtn = colorsModal.querySelector('.close');

        if (colorsCloseBtn) {
            colorsCloseBtn.addEventListener('click', () => {
                colorsModal.style.display = 'none';
            });
        }

        if (colorsModal) {
            colorsModal.addEventListener('click', (e) => {
                if (e.target === colorsModal) {
                    colorsModal.style.display = 'none';
                }
            });
        }

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.getElementById('colorsModal').style.display = 'none';
            }
        });
    }

    manageColorStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('colorsModal');
        const modalContent = document.getElementById('colorsModalContent');
        
        modalContent.innerHTML = this.generateColorStockManagementHTML(product);
        modal.style.display = 'block';
    }

    generateColorStockManagementHTML(product) {
        if (!product.colors || product.colors.length === 0) {
            return `
                <div style="text-align: center; padding: 40px;">
                    <p>No color options available for this product.</p>
                    <p>Add colors in the product edit form.</p>
                </div>
            `;
        }

        const totalStock = product.colorStock ? Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 0;

        let html = `
            <div class="color-management">
                <h3>${product.name}</h3>
                <div class="stock-summary">
                    <div class="total-stock">
                        <strong>Total Stock:</strong> <span class="stock-total">${totalStock}</span> pcs
                    </div>
                    <div class="stock-controls">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.inventoryManager.distributeStockEvenly('${product.id}')">
                            Distribute Evenly
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.inventoryManager.setAllStock('${product.id}', 0)">
                            Set All to 0
                        </button>
                    </div>
                </div>
                <p>Set available stock for each color:</p>
                <div class="colors-stock-list">
        `;

        product.colors.forEach(color => {
            const currentStock = product.colorStock ? (product.colorStock[color.name] || 0) : 0;
            const isAvailable = product.availableColors ? product.availableColors.includes(color.name) : true;
            
            html += `
                <div class="color-stock-item ${!isAvailable ? 'disabled' : ''}">
                    <div class="color-info">
                        <img src="${color.img}" alt="${color.name}" class="color-thumb" onerror="this.style.display='none'">
                        <span class="color-name">${color.name}</span>
                    </div>
                    <div class="stock-control">
                        <label class="availability-toggle">
                            <input type="checkbox" 
                                   ${isAvailable ? 'checked' : ''}
                                   onchange="window.inventoryManager.toggleColorAvailability('${product.id}', '${color.name}', this.checked)">
                            Available
                        </label>
                        <div class="stock-input-group">
                            <button type="button" class="stock-btn minus" onclick="window.inventoryManager.adjustColorStock('${product.id}', '${color.name}', -1)">-</button>
                            <input type="number" 
                                   class="stock-input" 
                                   value="${currentStock}" 
                                   min="0"
                                   onchange="window.inventoryManager.updateColorStock('${product.id}', '${color.name}', this.value)"
                                   ${!isAvailable ? 'disabled' : ''}>
                            <button type="button" class="stock-btn plus" onclick="window.inventoryManager.adjustColorStock('${product.id}', '${color.name}', 1)">+</button>
                        </div>
                        <span class="stock-display">${currentStock} pcs</span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="color-actions">
                    <button type="button" class="btn btn-primary" onclick="window.inventoryManager.saveColorStock('${product.id}')">
                        Save Stock Changes
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    // Color stock management methods
    toggleColorAvailability(productId, colorName, isAvailable) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (!product.availableColors) {
            product.availableColors = [];
        }

        if (isAvailable) {
            if (!product.availableColors.includes(colorName)) {
                product.availableColors.push(colorName);
            }
        } else {
            product.availableColors = product.availableColors.filter(color => color !== colorName);
            if (product.colorStock) {
                product.colorStock[colorName] = 0;
            }
        }

        this.updateColorStockModal(productId);
    }

    adjustColorStock(productId, colorName, adjustment) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.colorStock) return;

        const currentStock = product.colorStock[colorName] || 0;
        const newStock = Math.max(0, currentStock + adjustment);
        
        product.colorStock[colorName] = newStock;
        this.updateColorStockModal(productId);
    }

    updateColorStock(productId, colorName, newStock) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (!product.colorStock) {
            product.colorStock = {};
        }

        product.colorStock[colorName] = Math.max(0, parseInt(newStock) || 0);
        this.updateColorStockModal(productId);
    }

    distributeStockEvenly(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.colors || product.colors.length === 0) return;

        const availableColors = product.availableColors || product.colors.map(color => color.name);
        if (availableColors.length === 0) return;

        const totalStock = product.colorStock ? Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 0;
        const stockPerColor = Math.floor(totalStock / availableColors.length);
        const remainder = totalStock % availableColors.length;

        if (!product.colorStock) {
            product.colorStock = {};
        }

        product.colors.forEach(color => {
            product.colorStock[color.name] = 0;
        });

        availableColors.forEach((colorName, index) => {
            product.colorStock[colorName] = stockPerColor + (index < remainder ? 1 : 0);
        });

        this.updateColorStockModal(productId);
    }

    setAllStock(productId, stockValue) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.colors) return;

        if (!product.colorStock) {
            product.colorStock = {};
        }

        product.colors.forEach(color => {
            product.colorStock[color.name] = parseInt(stockValue) || 0;
        });

        this.updateColorStockModal(productId);
    }

    updateColorStockModal(productId) {
        const product = this.products.find(p => p.id === productId);
        const modalContent = document.getElementById('colorsModalContent');
        if (product && modalContent) {
            modalContent.innerHTML = this.generateColorStockManagementHTML(product);
        }
    }

    async saveColorStock(productId) {
        try {
            await this.saveToBackend();
            this.renderInventory();
            document.getElementById('colorsModal').style.display = 'none';
            this.showSuccess('Color stock updated successfully!');
        } catch (error) {
            console.error('Error saving color stock:', error);
            this.showError('Failed to save color stock. Please try again.');
        }
    }

    openModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.populateForm(product);
        } else {
            title.textContent = 'Add New Product';
            this.resetForm();
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
        this.resetForm();
    }

    resetForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            document.getElementById('productId').value = '';
        }
    }

    populateForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productDescription').value = product.description || '';
    }

    async saveProduct() {
        const productId = document.getElementById('productId').value;
        const formData = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value.trim(),
            image: document.getElementById('productImage').value.trim(),
            description: document.getElementById('productDescription').value.trim()
        };

        if (!formData.name || !formData.category || isNaN(formData.price) || isNaN(formData.stock)) {
            this.showError('Please fill in all required fields with valid data.');
            return;
        }

        try {
            if (productId) {
                const index = this.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    const existingProduct = this.products[index];
                    formData.colorStock = existingProduct.colorStock;
                    formData.availableColors = existingProduct.availableColors;
                    formData.colors = existingProduct.colors;
                    
                    this.products[index] = { ...this.products[index], ...formData };
                }
            } else {
                const newProduct = {
                    id: Date.now().toString(),
                    colorStock: {},
                    availableColors: [],
                    colors: [],
                    ...formData
                };
                this.products.push(newProduct);
            }

            await this.saveToBackend();
            this.renderInventory();
            this.closeModal();
            this.showSuccess(`Product ${productId ? 'updated' : 'added'} successfully!`);
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Failed to save product. Please try again.');
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.openModal(product);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            this.products = this.products.filter(p => p.id !== productId);
            await this.saveToBackend();
            this.renderInventory();
            this.showSuccess('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Failed to delete product. Please try again.');
        }
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tbody = document.getElementById('inventoryBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        No products match your search.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(product => {
            tbody.appendChild(this.createProductRow(product));
        });
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Make inventoryManager globally accessible
window.inventoryManager = new InventoryManager();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Inventory Manager...');
});
