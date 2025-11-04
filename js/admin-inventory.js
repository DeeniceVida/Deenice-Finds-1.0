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

    // ... (keep all existing methods like getStockStatus, formatStatusText, escapeHtml, etc.)

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

    // Update the populateForm method to include colors
    populateForm(product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productDescription').value = product.description || '';
        
        // Add colors input (you can enhance this with a better UI for adding multiple colors)
        const colorsInput = document.getElementById('productColors');
        if (colorsInput) {
            colorsInput.value = product.colors ? JSON.stringify(product.colors) : '';
        }
    }

    // Update the saveProduct method to handle colors
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

        // Handle colors data (you'll need to add proper color input in your form)
        const colorsInput = document.getElementById('productColors');
        if (colorsInput && colorsInput.value) {
            try {
                formData.colors = JSON.parse(colorsInput.value);
                formData.availableColors = formData.colors.map(color => color.name);
            } catch (e) {
                console.error('Error parsing colors:', e);
            }
        }

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
}

// Make inventoryManager globally accessible
let inventoryManager;

// Initialize inventory manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Inventory Manager...');
    inventoryManager = new InventoryManager();
});
