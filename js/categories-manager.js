// categories-manager.js
class CategoriesManager {
  constructor() {
    this.categoriesKey = 'deenice_categories';
    this.defaultCategories = [
      { id: 'phones', name: 'Phones', icon: '📱', order: 1 },
      { id: 'earbuds', name: 'Earbuds', icon: '🎧', order: 2 },
      { id: 'accessories', name: 'Accessories', icon: '⌚', order: 3 }
    ];
    this.init();
  }

  init() {
    if (!this.getCategories().length) {
      this.saveCategories(this.defaultCategories);
    }
  }

  getCategories() {
    try {
      return JSON.parse(localStorage.getItem(this.categoriesKey)) || [];
    } catch {
      return this.defaultCategories;
    }
  }

  saveCategories(categories) {
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    this.updateNavigation();
  }

  addCategory(name, icon = '📦') {
    const categories = this.getCategories();
    const newCategory = {
      id: this.slugify(name),
      name: name,
      icon: icon,
      order: categories.length + 1
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  editCategory(id, updates) {
    const categories = this.getCategories();
    const index = categories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      this.saveCategories(categories);
    }
  }

  deleteCategory(id) {
    const categories = this.getCategories().filter(cat => cat.id !== id);
    this.saveCategories(categories);
  }

  reorderCategories(orderedIds) {
    const categories = this.getCategories();
    const orderedCategories = orderedIds.map((id, index) => {
      const category = categories.find(cat => cat.id === id);
      return { ...category, order: index + 1 };
    });
    this.saveCategories(orderedCategories);
  }

  updateNavigation() {
    const menu = document.getElementById('products-categories-menu');
    if (!menu) return;

    const categories = this.getCategories();
    menu.innerHTML = categories
      .sort((a, b) => a.order - b.order)
      .map(cat => `
        <li>
          <a href="products.html?cat=${cat.id}">
            ${cat.icon} ${cat.name}
          </a>
        </li>
      `).join('');
  }

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Admin interface for managing categories
  openCategoriesManager() {
    const categories = this.getCategories();
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">Manage Product Categories</h3>
          <button onclick="this.closest('.admin-modal').remove()" style="
            background: none;
            border: none;
            font-size: 1.5em;
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>

        <div id="categories-list">
          ${categories.map(cat => `
            <div class="category-item" data-id="${cat.id}" style="
              display: flex;
              align-items: center;
              padding: 12px;
              border: 1px solid #e5e5e7;
              border-radius: 8px;
              margin-bottom: 10px;
              background: #f8f9fa;
            ">
              <span class="drag-handle" style="cursor: move; margin-right: 10px; font-size: 1.2em;">☰</span>
              <span style="margin-right: 10px;">${cat.icon}</span>
              <input type="text" value="${cat.name}" 
                onchange="categoriesManager.editCategory('${cat.id}', {name: this.value})"
                style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px;">
              <button onclick="categoriesManager.deleteCategory('${cat.id}')" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
              ">Delete</button>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e7;">
          <h4 style="margin-bottom: 10px;">Add New Category</h4>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="new-category-name" placeholder="Category name" style="
              flex: 1;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 6px;
            ">
            <button onclick="categoriesManager.handleAddCategory()" style="
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
            ">Add</button>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="this.closest('.admin-modal').remove()" style="
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
          ">Close</button>
          <button onclick="categoriesManager.saveAndClose()" style="
            padding: 10px 20px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.makeSortable();
  }

  handleAddCategory() {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();
    
    if (name) {
      this.addCategory(name);
      nameInput.value = '';
      this.openCategoriesManager(); // Refresh the modal
    }
  }

  makeSortable() {
    const list = document.getElementById('categories-list');
    if (!list) return;

    let draggedItem = null;

    list.querySelectorAll('.category-item').forEach(item => {
      item.setAttribute('draggable', true);

      item.addEventListener('dragstart', function() {
        draggedItem = this;
        setTimeout(() => this.style.opacity = '0.5', 0);
      });

      item.addEventListener('dragend', function() {
        this.style.opacity = '1';
        draggedItem = null;
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        if (draggedItem && draggedItem !== this) {
          list.insertBefore(draggedItem, this);
          categoriesManager.updateCategoryOrder();
        }
      });
    });
  }

  updateCategoryOrder() {
    const list = document.getElementById('categories-list');
    const orderedIds = Array.from(list.children).map(item => item.dataset.id);
    this.reorderCategories(orderedIds);
  }

  saveAndClose() {
    this.updateNavigation();
    document.querySelector('.admin-modal').remove();
    
    // Show success message
    this.showNotification('Categories updated successfully!', 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#28a745' : '#007bff'};
      color: white;
      border-radius: 6px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize categories manager
const categoriesManager = new CategoriesManager();
