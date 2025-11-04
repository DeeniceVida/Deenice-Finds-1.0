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

    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            const productsData = await response.json();
            
            // Transform the data to match what the inventory expects
            this.products = productsData.map(product => ({
                id: product.id,
                name: product.title,
                price: product.price,
                stock: product.stock || 0,
                category: product.category,
                image: product.images ? product.images[0] : '',
                description: product.description,
                colors: product.colors || [],
                // Initialize color stock - if not exists, create it
                colorStock: product.colorStock || this.initializeColorStock(product.colors, product.stock),
                availableColors: product.availableColors || (product.colors ? product.colors.map(color => color.name) : []),
                originalData: product
            }));
            
            console.log('Products loaded:', this.products.length);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please check the console for details.');
        }
    }

    initializeColorStock(colors, totalStock) {
        if (!colors || colors.length === 0) return {};
        
        const colorStock = {};
        const stockPerColor = Math.floor(totalStock / colors.length);
        const remainder = totalStock % colors.length;
        
        colors.forEach((color, index) => {
            // Distribute stock evenly, with remainder going to first color
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
        const status = this.getStockStatus(product.stock);
        const availableColorsCount = product.availableColors ? product.availableColors.length : 0;
        const totalColorsCount = product.colors ? product.colors.length : 0;
        
        // Calculate total stock from color stock
        const totalColorStock = product.colorStock ? Object.values(product.colorStock).reduce((sum, stock) => sum + stock, 0) : 0;
        
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
        const modal = document.getElementById('productModal');
        const closeBtn = document.querySelector('.close');
        const form = document.getElementById('productForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Updated method for color stock management
    manageColorStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('colorsModal');
        const modalContent = document.getElementById('colorsModalContent');
        
        if (!modal || !modalContent) {
            this.createColorsModal();
            this.manageColorStock(productId); // Retry after creating modal
            return;
        }

        modalContent.innerHTML = this.generateColorStockManagementHTML(product);
        modal.style.display = 'block';
    }

    createColorsModal() {
        const modalHTML = `
            <div id="colorsModal" class="modal">
                <div class="modal-content" style="max-width: 700px;">
                    <span class="close" onclick="document.getElementById('colorsModal').style.display='none'">&times;</span>
                    <h2>Manage Color Stock</h2>
                    <div id="colorsModalContent">
                        <!-- Color stock management content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
                        <button type="button" class="btn btn-sm btn-outline" onclick="inventoryManager.distributeStockEvenly('${product.id}')">
                            Distribute Evenly
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="inventoryManager.setAllStock('${product.id}', 0)">
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
                                   onchange="inventoryManager.toggleColorAvailability('${product.id}', '${color.name}', this.checked)">
                            Available
                        </label>
                        <div class="stock-input-group">
                            <button type="button" class="stock-btn minus" onclick="inventoryManager.adjustColorStock('${product.id}', '${color.name}', -1)">-</button>
                            <input type="number" 
                                   class="stock-input" 
                                   value="${currentStock}" 
                                   min="0"
                                   onchange="inventoryManager.updateColorStock('${product.id}', '${color.name}', this.value)"
                                   ${!isAvailable ? 'disabled' : ''}>
                            <button type="button" class="stock-btn plus" onclick="inventoryManager.adjustColorStock('${product.id}', '${color.name}', 1)">+</button>
                        </div>
                        <span class="stock-display">${currentStock} pcs</span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="color-actions">
                    <button type="button" class="btn btn-primary" onclick="inventoryManager.saveColorStock('${product.id}')">
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
            // Set stock to 0 when disabling a color
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

        // Reset all to 0 first
        product.colors.forEach(color => {
            product.colorStock[color.name] = 0;
        });

        // Distribute to available colors only
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

    // ... (keep all other existing methods like openModal, closeModal, etc.)

    // Update the saveProduct method to handle color stock
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

        // Validation
        if (!formData.name || !formData.category || isNaN(formData.price) || isNaN(formData.stock)) {
            this.showError('Please fill in all required fields with valid data.');
            return;
        }

        try {
            if (productId) {
                // Update existing product
                const index = this.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    // Preserve color stock when updating
                    const existingProduct = this.products[index];
                    formData.colorStock = existingProduct.colorStock;
                    formData.availableColors = existingProduct.availableColors;
                    formData.colors = existingProduct.colors;
                    
                    this.products[index] = { ...this.products[index], ...formData };
                }
            } else {
                // Add new product - initialize empty color stock
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

    // ... (keep all other existing methods)
}

// Make inventoryManager globally accessible
let inventoryManager;

// Initialize inventory manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Inventory Manager...');
    inventoryManager = new InventoryManager();
});
