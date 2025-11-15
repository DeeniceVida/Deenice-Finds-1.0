// categories-manager.js
class CategoriesManager {
  constructor() {
    this.categoriesKey = 'deenice_categories';
    this.defaultCategories = [
      { id: 'phones', name: 'Phones', icon: '📱', order: 1 },
      { id: 'earbuds', name: 'Earbuds', icon: '🎧', order: 2 },
      { id: 'accessories', name: 'Mobile Accessories', icon: '📱', order: 3 },
      { id: 'computer-accessories', name: 'Computer Accessories', icon: '💻', order: 4 },
      { id: 'wearables', name: 'Wearables', icon: '👓', order: 5 },
      { id: 'office-accessories', name: 'Office', icon: '🖊️', order: 6 },
      { id: 'home-accessories', name: 'Home', icon: '🏠', order: 7 }
    ];
    this.init();
  }

  init() {
    console.log('🔄 CategoriesManager initializing...');
    
    if (!this.getCategories().length) {
      this.saveCategories(this.defaultCategories);
    }
    
    // Auto-update navigation when manager is created
    this.updateNavigation();
    
    console.log('✅ CategoriesManager ready');
  }

  getCategories() {
    try {
      const categories = JSON.parse(localStorage.getItem(this.categoriesKey)) || [];
      console.log('📋 Loaded categories:', categories.length);
      return categories;
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      return this.defaultCategories;
    }
  }

  saveCategories(categories) {
    try {
      localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
      console.log('💾 Saved categories:', categories.length);
      this.updateNavigation();
      
      // Dispatch event for other components to know categories were updated
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (error) {
      console.error('❌ Error saving categories:', error);
    }
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
    if (!menu) {
      console.log('⚠️ Products categories menu not found yet');
      return;
    }

    const categories = this.getCategories();
    console.log('🔄 Updating navigation with categories:', categories.length);
    
    menu.innerHTML = categories
      .sort((a, b) => a.order - b.order)
      .map(cat => `
        <li>
          <a href="products.html?cat=${cat.id}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; transition: background 0.2s;">
            <span style="font-size: 1.1em;">${cat.icon}</span>
            <span style="font-weight: 500;">${cat.name}</span>
          </a>
        </li>
      `).join('');
    
    console.log('✅ Navigation updated successfully');
  }

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Get category by ID
  getCategoryById(id) {
    const categories = this.getCategories();
    return categories.find(cat => cat.id === id);
  }

  // Get all category IDs
  getAllCategoryIds() {
    return this.getCategories().map(cat => cat.id);
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        padding: 30px;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e5e5e7;">
          <h3 style="margin: 0; color: #1d1d1f; font-weight: 600;">Manage Product Categories</h3>
          <button onclick="this.closest('.admin-modal').remove()" style="
            background: none;
            border: none;
            font-size: 1.5em;
            cursor: pointer;
            color: #86868b;
            padding: 5px;
            border-radius: 50%;
            transition: background 0.2s;
          " aria-label="Close">×</button>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <h4 style="margin: 0 0 8px 0; color: #1d1d1f; font-size: 0.9em; font-weight: 600;">💡 Tip</h4>
          <p style="margin: 0; color: #666; font-size: 0.85em; line-height: 1.4;">
            Drag to reorder categories. Changes will update the navigation menu instantly.
          </p>
        </div>

        <div id="categories-list">
          ${categories.map(cat => `
            <div class="category-item" data-id="${cat.id}" style="
              display: flex;
              align-items: center;
              padding: 15px;
              border: 1px solid #e5e5e7;
              border-radius: 12px;
              margin-bottom: 12px;
              background: white;
              transition: all 0.2s ease;
              cursor: move;
            ">
              <span class="drag-handle" style="margin-right: 12px; font-size: 1.2em; color: #86868b; cursor: move;">☰</span>
              <span style="margin-right: 12px; font-size: 1.3em;">${cat.icon}</span>
              <input type="text" value="${cat.name}" 
                onchange="categoriesManager.editCategory('${cat.id}', {name: this.value})"
                style="flex: 1; padding: 10px 12px; border: 1px solid #e5e5e7; border-radius: 8px; font-size: 0.95em; color: #1d1d1f; background: #f8f9fa;">
              <button onclick="categoriesManager.deleteCategory('${cat.id}')" style="
                background: #ff3b30;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9em;
                font-weight: 500;
                margin-left: 10px;
                transition: background 0.2s;
              ">Delete</button>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e5e7;">
          <h4 style="margin-bottom: 15px; color: #1d1d1f; font-weight: 600;">Add New Category</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="text" id="new-category-name" placeholder="Enter category name" style="
              flex: 1;
              padding: 12px 16px;
              border: 1px solid #e5e5e7;
              border-radius: 10px;
              font-size: 0.95em;
              background: #f8f9fa;
              color: #1d1d1f;
            ">
            <button onclick="categoriesManager.handleAddCategory()" style="
              background: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.95em;
              transition: background 0.2s;
              white-space: nowrap;
            ">Add Category</button>
          </div>
        </div>

        <div style="margin-top: 25px; display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #e5e5e7;">
          <button onclick="this.closest('.admin-modal').remove()" style="
            padding: 12px 24px;
            border: 1px solid #e5e5e7;
            background: white;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 500;
            color: #1d1d1f;
            transition: all 0.2s;
          ">Close</button>
          <button onclick="categoriesManager.saveAndClose()" style="
            padding: 12px 24px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
          ">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Add hover effects
    const categoryItems = modal.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        this.style.borderColor = '#007bff';
      });
      item.addEventListener('mouseleave', function() {
        this.style.boxShadow = 'none';
        this.style.borderColor = '#e5e5e7';
      });
    });

    this.makeSortable();
  }

  handleAddCategory() {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();
    
    if (name) {
      this.addCategory(name);
      nameInput.value = '';
      
      // Show success feedback
      this.showNotification(`"${name}" category added successfully!`, 'success');
      
      // Refresh the modal after a short delay
      setTimeout(() => {
        this.openCategoriesManager();
      }, 800);
    } else {
      this.showNotification('Please enter a category name', 'error');
    }
  }

  makeSortable() {
    const list = document.getElementById('categories-list');
    if (!list) return;

    let draggedItem = null;

    list.querySelectorAll('.category-item').forEach(item => {
      item.setAttribute('draggable', true);

      item.addEventListener('dragstart', function(e) {
        draggedItem = this;
        setTimeout(() => {
          this.style.opacity = '0.6';
          this.style.background = '#f0f0f0';
        }, 0);
        
        // Set drag image
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
      });

      item.addEventListener('dragend', function() {
        this.style.opacity = '1';
        this.style.background = 'white';
        draggedItem = null;
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Visual feedback for drop target
        if (draggedItem && draggedItem !== this) {
          this.style.borderTop = '2px solid #007bff';
        }
      });

      item.addEventListener('dragleave', function() {
        this.style.borderTop = '1px solid #e5e5e7';
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderTop = '1px solid #e5e5e7';
        
        if (draggedItem && draggedItem !== this) {
          // Check if we're dropping above or below
          const rect = this.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          
          if (e.clientY < midY) {
            list.insertBefore(draggedItem, this);
          } else {
            list.insertBefore(draggedItem, this.nextSibling);
          }
          
          categoriesManager.updateCategoryOrder();
          categoriesManager.showNotification('Categories reordered!', 'success');
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
    const modal = document.querySelector('.admin-modal');
    if (modal) {
      modal.remove();
    }
    
    this.showNotification('Categories updated successfully!', 'success');
  }

  showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#ff3b30' : '#007bff'};
      color: white;
      border-radius: 12px;
      z-index: 10001;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      font-weight: 600;
      font-size: 0.95em;
      max-width: 300px;
      transform: translateX(400px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }
}

// Initialize categories manager
const categoriesManager = new CategoriesManager();

// Export for global access
window.categoriesManager = categoriesManager;

// Auto-update navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM loaded, updating categories navigation...');
  setTimeout(() => {
    if (typeof categoriesManager !== 'undefined') {
      categoriesManager.updateNavigation();
    }
  }, 100);
});

// Also update when coming back to the page
window.addEventListener('pageshow', function() {
  setTimeout(() => {
    if (typeof categoriesManager !== 'undefined') {
      categoriesManager.updateNavigation();
    }
  }, 50);
});

// Listen for storage events from other tabs/windows
window.addEventListener('storage', function(e) {
  if (e.key === 'deenice_categories') {
    console.log('Categories updated from another tab, refreshing...');
    setTimeout(() => {
      if (typeof categoriesManager !== 'undefined') {
        categoriesManager.updateNavigation();
      }
    }, 100);
  }
});
