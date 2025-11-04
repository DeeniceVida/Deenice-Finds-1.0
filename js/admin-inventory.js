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
                name: product.title, // Map 'title' to 'name'
                price: product.price,
                stock: product.stock || 0,
                category: product.category,
                image: product.images ? product.images[0] : '', // Use first image
                description: product.description,
                colors: product.colors || [], // Include colors array
                availableColors: product.colors ? product.colors.map(color => color.name) : [], // All colors available by default
                // Keep original data for reference
                originalData: product
            }));
            
            console.log('Products loaded:', this.products.length);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please check the console for details.');
        }
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
            <td>${product.stock}</td>
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
                <button class="colors-btn" data-id="${product.id}">Colors</button>
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
                    this.manageColors(target.dataset.id);
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

    // Add this new method for color management
    manageColors(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('colorsModal');
        const modalContent = document.getElementById('colorsModalContent');
        
        if (!modal || !modalContent) {
            this.createColorsModal();
            this.manageColors(productId); // Retry after creating modal
            return;
        }

        modalContent.innerHTML = this.generateColorsManagementHTML(product);
        modal.style.display = 'block';
    }

    createColorsModal() {
        const modalHTML = `
            <div id="colorsModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close" onclick="document.getElementById('colorsModal').style.display='none'">&times;</span>
                    <h2>Manage Color Availability</h2>
                    <div id="colorsModalContent">
                        <!-- Color management content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    generateColorsManagementHTML(product) {
        if (!product.colors || product.colors.length === 0) {
            return `
                <div style="text-align: center; padding: 40px;">
                    <p>No color options available for this product.</p>
                    <p>Add colors in the product edit form.</p>
                </div>
            `;
        }

        let html = `
            <div class="color-management">
                <h3>${product.name}</h3>
                <p>Select which color options are available for purchase:</p>
                <div class="colors-list">
        `;

        product.colors.forEach(color => {
            const isAvailable = product.availableColors ? 
                product.availableColors.includes(color.name) : true;
            
            html += `
                <div class="color-option">
                    <label class="color-checkbox">
                        <input type="checkbox" 
                               name="availableColors" 
                               value="${color.name}" 
                               ${isAvailable ? 'checked' : ''}
                               onchange="inventoryManager.toggleColorAvailability('${product.id}', '${color.name}', this.checked)">
                        <div class="color-preview">
                            <img src="${color.img}" alt="${color.name}" class="color-thumb" onerror="this.style.display='none'">
                            <span class="color-name">${color.name}</span>
                        </div>
                    </label>
                </div>
            `;
        });

        html += `
                </div>
                <div class="color-actions">
                    <button type="button" class="btn btn-primary" onclick="inventoryManager.selectAllColors('${product.id}')">
                        Select All
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="inventoryManager.deselectAllColors('${product.id}')">
                        Deselect All
                    </button>
                    <button type="button" class="btn btn-success" onclick="inventoryManager.saveColorAvailability('${product.id}')">
                        Save Changes
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    // Color management methods
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
        }
    }

    selectAllColors(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && product.colors) {
            product.availableColors = product.colors.map(color => color.name);
            this.updateColorsModal(productId);
        }
    }

    deselectAllColors(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.availableColors = [];
            this.updateColorsModal(productId);
        }
    }

    updateColorsModal(productId) {
        const product = this.products.find(p => p.id === productId);
        const modalContent = document.getElementById('colorsModalContent');
        if (product && modalContent) {
            modalContent.innerHTML = this.generateColorsManagementHTML(product);
        }
    }

    async saveColorAvailability(productId) {
        try {
            await this.saveToBackend();
            this.renderInventory();
            document.getElementById('colorsModal').style.display = 'none';
            this.showSuccess('Color availability updated successfully!');
        } catch (error) {
            console.error('Error saving color availability:', error);
            this.showError('Failed to save color availability. Please try again.');
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
        
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.style.display = 'none';
        }
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
                    this.products[index] = { ...this.products[index], ...formData };
                }
            } else {
                // Add new product
                const newProduct = {
                    id: Date.now().toString(),
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

    async saveToBackend() {
        // For now, we'll just log the products
        // In a real application, you would send this to your server
        console.log('Current products:', this.products);
        
        // Since we're working with static files, we'll use localStorage as a fallback
        localStorage.setItem('inventory_products', JSON.stringify(this.products));
        
        // Note: To actually update products.json, you'll need backend integration
        // This would require additional server-side code
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Make inventoryManager globally accessible
let inventoryManager;

// Initialize inventory manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Inventory Manager...');
    inventoryManager = new InventoryManager();
});
