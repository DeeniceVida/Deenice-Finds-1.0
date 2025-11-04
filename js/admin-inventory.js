class InventoryManager {
    constructor() {
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderInventory();
        this.setupEventListeners();
    }

    async loadProducts() {
        try {
            const response = await fetch('../data/products.json');
            this.products = await response.json();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    renderInventory() {
        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '';

        this.products.forEach(product => {
            const row = this.createProductRow(product);
            tbody.appendChild(row);
        });
    }

    createProductRow(product) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name}" class="product-thumb"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price}</td>
            <td>${product.stock}</td>
            <td><span class="status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
            <td class="actions">
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </td>
        `;
        return row;
    }

    setupEventListeners() {
        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Search functionality
        document.getElementById('searchInventory').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Edit/Delete buttons (event delegation)
        document.getElementById('inventoryBody').addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                this.editProduct(e.target.dataset.id);
            }
            if (e.target.classList.contains('delete-btn')) {
                this.deleteProduct(e.target.dataset.id);
            }
        });
    }

    openModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.populateForm(product);
        } else {
            title.textContent = 'Add Product';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('productModal').style.display = 'none';
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
        const formData = new FormData(document.getElementById('productForm'));
        const productId = document.getElementById('productId').value;
        
        const productData = {
            id: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value
        };

        if (productId) {
            // Update existing product
            const index = this.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...productData };
            }
        } else {
            // Add new product
            this.products.push(productData);
        }

        await this.saveToBackend();
        this.renderInventory();
        this.closeModal();
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.openModal(product);
        }
    }

    async deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== productId);
            await this.saveToBackend();
            this.renderInventory();
        }
    }

    filterProducts(searchTerm) {
        const filtered = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = '';
        filtered.forEach(product => {
            tbody.appendChild(this.createProductRow(product));
        });
    }

    async saveToBackend() {
        // You'll need to implement this based on your backend
        // This could be an API call to your server.js
        console.log('Saving products:', this.products);
        // Example: await fetch('/api/products', { method: 'POST', body: JSON.stringify(this.products) });
    }
}

// Initialize inventory manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new InventoryManager();
});
