document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    let products = [];
    const user = JSON.parse(localStorage.getItem('zeno-user'));
    const token = localStorage.getItem('zeno-token');

    const isAdmin = user && (user.role === 'admin' || user.email === 'osikokhaiazemobo@gmail.com');

    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // --- Elements ---
    const productsTbody = document.getElementById('products-tbody');
    const prodModal = document.getElementById('product-modal-overlay');
    const prodForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const adminDisplayName = document.getElementById('admin-display-name');
    
    // Stats
    const statTotalProducts = document.getElementById('stat-total-products');
    const statLowStock = document.getElementById('stat-low-stock');
    const statTotalValue = document.getElementById('stat-total-value');

    // --- Init ---
    adminDisplayName.textContent = user.username;
    const adminInitials = document.getElementById('admin-initials');
    if (adminInitials) adminInitials.textContent = user.username.charAt(0).toUpperCase();
    fetchProducts();

    // --- Functions ---
    async function fetchProducts() {
        try {
            const res = await fetch('/api/products');
            products = await res.json();
            renderProducts();
            updateStats();
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    }

    function renderProducts() {
        productsTbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    <div class="prod-cell">
                        <img src="${p.image_url}" class="prod-img">
                        <span class="prod-name">${p.name}</span>
                    </div>
                </td>
                <td><span class="cat-tag">${p.category}</span></td>
                <td>$${p.price.toFixed(2)}</td>
                <td>
                    <span class="stock-tag ${p.stock < 5 ? 'low' : ''}">
                        ${p.stock} units ${p.stock < 5 ? '(!)' : ''}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn edit" onclick="openEditModal(${p.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteProduct(${p.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function updateStats() {
        statTotalProducts.textContent = products.length;
        statLowStock.textContent = products.filter(p => p.stock < 5).length;
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        statTotalValue.textContent = `$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    // --- Modal Management ---
    window.openEditModal = (id) => {
        const p = products.find(prod => prod.id === id);
        if (!p) return;

        modalTitle.textContent = 'Edit Product ✧';
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-image').value = p.image_url;
        document.getElementById('prod-desc').value = p.description;

        prodModal.style.display = 'flex';
    };

    document.getElementById('add-product-btn').addEventListener('click', () => {
        modalTitle.textContent = 'Curate New Item ✧';
        prodForm.reset();
        document.getElementById('prod-id').value = '';
        prodModal.style.display = 'flex';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        prodModal.style.display = 'none';
    });

    document.getElementById('cancel-modal').addEventListener('click', () => {
        prodModal.style.display = 'none';
    });

    prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const payload = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
            price: parseFloat(document.getElementById('prod-price').value),
            stock: parseInt(document.getElementById('prod-stock').value),
            image_url: document.getElementById('prod-image').value,
            description: document.getElementById('prod-desc').value
        };

        const url = id ? `/api/products/${id}` : '/api/products';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save product");

            prodModal.style.display = 'none';
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    });

    window.deleteProduct = async (id) => {
        if (!confirm("Are you sure you want to remove this item from the collection?")) return;

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to delete product");
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    // --- Side Nav ---
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.classList.contains('exit')) return;
            e.preventDefault();
            
            document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const view = item.dataset.view;
            document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');

            document.getElementById('view-title').textContent = view === 'inventory' ? 'Inventory Curation' : 'Order Management';
            document.getElementById('view-subtitle').textContent = view === 'inventory' 
                ? 'Manage your product collection and pricing.' 
                : 'Track and process customer orders.';
        });
    });

    document.getElementById('admin-logout').addEventListener('click', () => {
        user = null; // Update local state for redirects
        localStorage.removeItem('zeno-user');
        localStorage.removeItem('zeno-token');
        window.location.href = 'index.html';
    });
});
