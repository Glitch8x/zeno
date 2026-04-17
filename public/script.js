document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const STORE_EMAIL = 'osikokhaiazemobo@gmail.com';
    const WHATSAPP_NUMBER = '2348132567672'; // Updated with real number

    // State management
    let products = [];
    let cart = JSON.parse(localStorage.getItem('zeno-cart')) || [];
    let user = JSON.parse(localStorage.getItem('zeno-user')) || null;

    // API Base
    const API_URL = '/api';

    // Elements
    const productGrid = document.querySelector('.product-grid');
    const cartCount = document.querySelectorAll('.cart-count');
    const mainContent = document.querySelector('main');
    const authLinks = document.querySelector('.auth-links');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartItemsList = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total-value');
    const overlay = document.querySelector('.overlay');
    const header = document.querySelector('header');

    // --- Core Logic ---

    function showSkeletons() {
        if (!productGrid) return;
        productGrid.innerHTML = Array(6).fill(`
            <div class="product-card skeleton-card">
                <div class="skeleton-img"></div>
                <div class="product-info">
                    <div class="skeleton-line" style="width:70%"></div>
                    <div class="skeleton-line" style="width:40%; margin-top:0.5rem;"></div>
                </div>
            </div>
        `).join('');
    }

    async function fetchProducts() {
        showSkeletons();
        try {
            const res = await fetch(`${API_URL}/products`);
            products = await res.json();
            renderProducts(products);
            setupScrollReveal();
        } catch (err) {
            console.error("Failed to fetch products", err);
            if (productGrid) productGrid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;">Could not load products.</p>';
        }
    }

    function renderProducts(list) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        if (!list || list.length === 0) {
            productGrid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;grid-column:1/-1;">No products found.</p>';
            return;
        }
        list.forEach((product) => {
            const card = document.createElement('div');
            card.className = 'product-card scroll-reveal';
            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image_url}" alt="${product.name}" class="product-image" loading="lazy">
                    <div class="quick-add">
                        <div class="btn-plus add-to-cart" data-id="${product.id}">+</div>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-cat-tag">${product.category}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                </div>
            `;
            card.querySelector('.product-name').addEventListener('click', () => showProductDetails(product.id));
            card.querySelector('.product-image').addEventListener('click', () => showProductDetails(product.id));
            card.querySelector('.add-to-cart').addEventListener('click', (e) => {
                addToCart(product.id);
                e.stopPropagation();
            });
            productGrid.appendChild(card);
        });
    }

    // --- Animations & Interactivity ---

    function setupScrollReveal() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });
    }

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '1rem 5%';
            header.style.background = 'rgba(252, 252, 252, 0.98)';
        } else {
            header.style.padding = '1.5rem 5%';
            header.style.background = 'rgba(252, 252, 252, 0.9)';
        }
    });

    function showProductDetails(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        window.scrollTo({ top: 0, behavior: 'smooth' });
        mainContent.innerHTML = `
            <div class="container scroll-reveal active">
                <button class="btn btn-secondary back-to-shop" style="width: auto; margin-bottom: 3rem;">← Back to Collection</button>
                <div class="product-details">
                    <img src="${product.image_url}" alt="${product.name}" class="details-image">
                    <div class="details-info">
                        <span class="product-category">${product.category}</span>
                        <h2>${product.name}</h2>
                        <span class="details-price">$${product.price.toFixed(2)}</span>
                        <p class="details-description">${product.description}</p>
                        <button class="btn add-to-cart-large" style="width: 100%;" data-id="${product.id}">Add to Bag</button>
                    </div>
                </div>
            </div>
        `;

        document.querySelector('.back-to-shop').addEventListener('click', () => location.reload());
        document.querySelector('.add-to-cart-large').addEventListener('click', () => addToCart(product.id));
    }

    // --- Cart Management ---

    function addToCart(id) {
        const product = products.find(p => p.id === id);
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCart();
        updateUI();
        openCart();
    }

    function saveCart() {
        localStorage.setItem('zeno-cart', JSON.stringify(cart));
    }

    function updateUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.forEach(el => el.textContent = totalItems);
        renderCartItems();
        updateAuthState();
    }

    function renderCartItems() {
        if (!cartItemsList) return;
        cartItemsList.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${item.image_url}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-qty-controls">
                        <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-remove-btn" data-id="${item.id}">×</button>
            `;
            itemEl.querySelector('.cart-remove-btn').addEventListener('click', () => removeFromCart(item.id));
            itemEl.querySelector('.qty-minus').addEventListener('click', () => changeQty(item.id, -1));
            itemEl.querySelector('.qty-plus').addEventListener('click', () => changeQty(item.id, 1));
            cartItemsList.appendChild(itemEl);
        });

        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    function changeQty(id, delta) {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) removeFromCart(id);
        else { saveCart(); updateUI(); }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateUI();
    }

    function openCart() {
        cartDrawer.classList.add('active');
        overlay.style.display = 'flex';
    }

    function closeCart() {
        cartDrawer.classList.remove('active');
        overlay.style.display = 'none';
        // If coming from checkout success, we might need a reload
        if (document.querySelector('.checkout-steps')) {
            location.reload();
        }
    }

    // --- Auth Management ---

    function updateAuthState() {
        const loginWall = document.getElementById('login-wall');
        const appContent = document.getElementById('app-content');
        
        if (!authLinks) return;
        if (user) {
            authLinks.innerHTML = `
                <a class="nav-link" id="account-link" style="cursor:pointer;">Account</a>
                <a class="nav-link" id="logout-btn" style="cursor:pointer;">(Logout)</a>
            `;

            // Toggle Admin link visibility (matches hardcoded ID in index.html)
            const adminNavItem = document.getElementById('admin-nav-item');
            const isAdmin = user.role === 'admin' || user.email === 'osikokhaiazemobo@gmail.com';
            
            if (adminNavItem) {
                adminNavItem.style.display = isAdmin ? 'inline-block' : 'none';
                console.log("ZENO Admin Check:", isAdmin, user.role, user.email);
            }

            document.getElementById('logout-btn').addEventListener('click', logout);
            document.getElementById('account-link').addEventListener('click', showAccountView);
            
            if (loginWall) loginWall.style.display = 'none';
            if (appContent) appContent.style.display = 'block';
        } else {
            authLinks.innerHTML = '';
            
            if (loginWall) loginWall.style.display = 'flex';
            if (appContent) appContent.style.display = 'none';
            showLoginFormWall();
        }
    }

    function setWallTab(tab) {
        const loginBtn = document.getElementById('wall-tab-login');
        const signupBtn = document.getElementById('wall-tab-signup');
        if (!loginBtn || !signupBtn) return;
        if (tab === 'login') {
            loginBtn.classList.add('active');
            signupBtn.classList.remove('active');
            showLoginFormWall();
        } else {
            signupBtn.classList.add('active');
            loginBtn.classList.remove('active');
            showRegisterFormWall();
        }
    }

    function showLoginFormWall() {
        const container = document.getElementById('wall-auth-container');
        if (!container) return;
        container.innerHTML = `
            <h2>Log In</h2>
            <p class="wall-subtitle">You are a step away from something great!</p>
            <form id="wall-login-form">
                <div class="form-group">
                    <label>Email / Username</label>
                    <input type="email" id="wall-login-email" required placeholder="example@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="wall-login-password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn" style="width: 100%; margin-top: 0.5rem;">Log In</button>
                <p style="margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-muted);">
                    This site is over 18. <a href="#" style="text-decoration: underline;">Learn more</a>
                </p>
            </form>
        `;
        document.getElementById('wall-login-form').addEventListener('submit', handleLogin);
    }

    function showRegisterFormWall() {
        const container = document.getElementById('wall-auth-container');
        if (!container) return;
        container.innerHTML = `
            <h2>Sign Up</h2>
            <p class="wall-subtitle">You are a step away from something great!</p>
            <form id="wall-register-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="wall-reg-username" required placeholder="Your name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="wall-reg-email" required placeholder="example@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="wall-reg-password" required placeholder="Choose a secure password">
                </div>
                <div style="display: flex; align-items: flex-start; gap: 0.7rem; margin-bottom: 1.5rem;">
                    <input type="checkbox" id="wall-terms" required style="margin-top: 3px; flex-shrink: 0;">
                    <label for="wall-terms" style="font-size: 0.8rem; color: var(--text-muted); text-transform: none; letter-spacing: 0;">I agree to terms of service. <a href="#" style="text-decoration: underline;">This site is over 18, learn more</a></label>
                </div>
                <button type="submit" class="btn" style="width: 100%;">Sign Up</button>
            </form>
        `;
        document.getElementById('wall-register-form').addEventListener('submit', handleRegister);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('wall-login-email').value;
        const password = document.getElementById('wall-login-password').value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            user = data.user;
            localStorage.setItem('zeno-user', JSON.stringify(user));
            localStorage.setItem('zeno-token', data.token);
            overlay.style.display = 'none';
            updateUI();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('wall-reg-username').value;
        const email = document.getElementById('wall-reg-email').value;
        const password = document.getElementById('wall-reg-password').value;

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            alert("Registration successful! Please login.");
            showLoginFormWall();
        } catch (err) {
            alert(err.message);
        }
    }

    function logout() {
        user = null;
        localStorage.removeItem('zeno-user');
        localStorage.removeItem('zeno-token');
        updateUI();
        location.reload();
    }

    // --- Checkout Flow (WhatsApp + PDF + Email) ---

    function startCheckout() {
        if (!user) { showLoginFormWall(); return; }
        if (cart.length === 0) return;

        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal animate-up" style="max-width: 600px; position: relative;">
                <span style="position:absolute;top:1.5rem;right:1.5rem;font-size:1.5rem;cursor:pointer;" id="close-checkout">×</span>
                <h2 style="margin-bottom: 0.5rem; font-style: italic;">Shipping Details</h2>
                <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:2rem;">Fill in your delivery info, then pay via WhatsApp.</p>
                <div id="checkout-content">
                    <form id="shipping-form">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="ship-name" required placeholder="Your full name">
                        </div>
                        <div class="form-group">
                            <label>Street Address</label>
                            <input type="text" id="ship-address" required placeholder="123 Your Street">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div class="form-group">
                                <label>City</label>
                                <input type="text" id="ship-city" required placeholder="City">
                            </div>
                            <div class="form-group">
                                <label>Postal Code</label>
                                <input type="text" id="ship-postal" required placeholder="10001">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Phone / WhatsApp</label>
                            <input type="tel" id="ship-phone" required placeholder="+1 234 567 8901">
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">Confirm Order →</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('close-checkout').addEventListener('click', () => {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        });

        document.getElementById('shipping-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const shippingInfo = {
                name: document.getElementById('ship-name').value,
                address: document.getElementById('ship-address').value,
                city: document.getElementById('ship-city').value,
                postal: document.getElementById('ship-postal').value,
                phone: document.getElementById('ship-phone').value,
            };
            await placeOrder(shippingInfo);
        });
    }

    async function placeOrder(shippingInfo) {
        const token = localStorage.getItem('zeno-token');
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Save the order to the backend
        let orderId = 'DRAFT';
        try {
            const res = await fetch(`${API_URL}/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ cartItems: cart, totalPrice: total })
            });
            const data = await res.json();
            if (!data.error) orderId = data.orderId;
        } catch(e) {}

        const orderRef = `ZENO-${orderId}`;
        const itemLines = cart.map(i => `${i.name} x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');

        // Build WhatsApp message
        const waMsg = encodeURIComponent(
            `Hi ZENO STORE 👋\n\nI'd like to place an order:\n\n${itemLines}\n\nTotal: $${total.toFixed(2)}\n\nOrder Ref: ${orderRef}\n\nShip to:\n${shippingInfo.name}\n${shippingInfo.address}, ${shippingInfo.city} ${shippingInfo.postal}\nPhone: ${shippingInfo.phone}`
        );
        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

        // Build mailto
        const mailBody = encodeURIComponent(
            `Order Reference: ${orderRef}\n\n${itemLines}\n\nTotal: $${total.toFixed(2)}\n\nShipping:\n${shippingInfo.name}\n${shippingInfo.address}, ${shippingInfo.city} ${shippingInfo.postal}\nPhone: ${shippingInfo.phone}`
        );
        const mailLink = `mailto:${STORE_EMAIL}?subject=Order ${orderRef}&body=${mailBody}`;

        // Save snapshot for PDF before clearing cart
        localStorage.setItem('zeno-cart-snapshot', JSON.stringify(cart));

        // Show confirmation screen
        const container = document.getElementById('checkout-content');
        container.innerHTML = `
            <div style="text-align:center; padding: 2rem 0;">
                <h2 style="font-style:italic; font-size:2.5rem; margin-bottom:0.8rem;">Order Ready ✦</h2>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:2.5rem; max-width:360px; margin-inline:auto;">
                    Ref: <strong>${orderRef}</strong> · $${total.toFixed(2)} total. Complete your payment below.
                </p>

                <div style="display:flex; flex-direction:column; gap:1rem; max-width:340px; margin:0 auto;">

                    <a href="${waLink}" target="_blank" class="btn" style="width:100%; background:#25D366; display:flex; align-items:center; justify-content:center; gap:0.8rem; text-decoration:none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Pay via WhatsApp
                    </a>

                    <button class="btn btn-secondary" id="dl-pdf-btn" style="width:100%;">
                        ↓ Download Invoice PDF
                    </button>

                    <a href="${mailLink}" class="btn btn-secondary" style="width:100%; text-decoration:none; display:block;">
                        ✉ Send Order by Email
                    </a>
                </div>

                <p style="margin-top:2rem;font-size:0.75rem;color:var(--text-muted);">
                    We'll confirm dispatch within 24 hours.
                </p>
                <button class="btn-link" style="margin-top:1rem;font-size:0.8rem;cursor:pointer;background:none;border:none;text-decoration:underline;" id="back-to-shop-btn">Continue Shopping</button>
            </div>
        `;

        document.getElementById('dl-pdf-btn').addEventListener('click', () => downloadInvoicePDF(orderRef, shippingInfo, total));
        document.getElementById('back-to-shop-btn').addEventListener('click', () => {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
            cart = [];
            saveCart();
            updateUI();
        });

        // Clear cart
        cart = [];
        saveCart();
        updateUI();
    }

    function downloadInvoicePDF(orderRef, shippingInfo, total) {
        const itemRows = JSON.parse(localStorage.getItem('zeno-cart-snapshot') || '[]')
            .map(i => `<tr><td>${i.name}</td><td>x${i.quantity}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>`)
            .join('') || cart.map(i => `<tr><td>${i.name}</td><td>x${i.quantity}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('');

        const html = `
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <title>ZENO Invoice ${orderRef}</title>
            <style>
                body { font-family: Georgia, serif; color: #1a1a1a; padding: 60px; max-width: 700px; margin: 0 auto; }
                h1 { letter-spacing: 0.2em; font-size: 2rem; margin-bottom: 0.3rem; }
                .subtitle { color: #888; font-size: 0.85rem; margin-bottom: 2.5rem; }
                .section { margin-bottom: 2rem; }
                .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #888; margin-bottom: 0.3rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th { text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; padding-bottom: 0.8rem; border-bottom: 1px solid #eee; }
                td { padding: 0.9rem 0; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
                .total-row td { font-weight: bold; font-size: 1.1rem; border-bottom: none; padding-top: 1.2rem; }
                .footer { margin-top: 3rem; font-size: 0.78rem; color: #aaa; border-top: 1px solid #eee; padding-top: 1.5rem; }
            </style></head><body>
            <h1>ZENO STORE</h1>
            <div class="subtitle">Order Invoice</div>
            <div class="section">
                <div class="label">Order Reference</div>
                <div><strong>${orderRef}</strong></div>
            </div>
            <div class="section">
                <div class="label">Invoice Date</div>
                <div>${new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'})}</div>
            </div>
            <div class="section">
                <div class="label">Ship To</div>
                <div>${shippingInfo.name}<br>${shippingInfo.address}<br>${shippingInfo.city} ${shippingInfo.postal}<br>${shippingInfo.phone}</div>
            </div>
            <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
                <tbody>
                    ${itemRows || `<tr><td colspan="3">Items in order</td></tr>`}
                    <tr class="total-row"><td>Total</td><td></td><td>$${total.toFixed(2)}</td></tr>
                </tbody>
            </table>
            <div class="footer">ZENO STORE Lifestyle · Thank you for your order. Payment via WhatsApp is expected within 24h of confirmation.</div>
            </body></html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) { win.onload = () => { win.print(); }; }
    }

    // --- Init ---

    async function refreshUser() {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const refreshedUser = await res.json();
                console.log("ZENO: Session Refreshed", refreshedUser.role);
                user = refreshedUser;
                localStorage.setItem('zeno-user', JSON.stringify(user));
                updateUI();
            } else {
                console.warn("ZENO: Session refresh failed");
            }
        } catch (err) {
            console.error("ZENO: Auth error", err);
        }
    }

    const token = localStorage.getItem('zeno-token');
    refreshUser();
    fetchProducts();
    updateUI();

    // Wall tab buttons
    const wallTabLogin = document.getElementById('wall-tab-login');
    const wallTabSignup = document.getElementById('wall-tab-signup');
    if (wallTabLogin) wallTabLogin.addEventListener('click', () => setWallTab('login'));
    if (wallTabSignup) wallTabSignup.addEventListener('click', () => setWallTab('signup'));

    // --- SPA View Logic ---
    const navHome = document.getElementById('nav-home');
    const navShop = document.getElementById('nav-shop');
    const heroSection = document.getElementById('hero-section');
    const categoryNav = document.getElementById('category-nav');
    const gridTitle = document.querySelector('.grid-header h2');
    const gridSub = document.querySelector('.grid-header .product-category');

    function hideAllViews() {
        if(heroSection) heroSection.style.display = 'none';
        if(categoryNav) categoryNav.style.display = 'none';
        const accountSection = document.getElementById('account-section');
        if(accountSection) accountSection.style.display = 'none';
        const mainGrid = document.querySelector('.container');
        if(mainGrid) mainGrid.style.display = 'none';
    }

    function showHomeView() {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        if(navHome) navHome.classList.add('active');
        hideAllViews();
        if(heroSection) heroSection.style.display = 'block';
        const mainGrid = document.querySelector('.container');
        if(mainGrid) mainGrid.style.display = 'block';
        if(gridTitle) gridTitle.textContent = 'Essentials';
        if(gridSub) gridSub.textContent = 'Curation 01';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showShopView() {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        if(navShop) navShop.classList.add('active');
        hideAllViews();
        if(categoryNav) categoryNav.style.display = 'flex';
        const mainGrid = document.querySelector('.container');
        if(mainGrid) mainGrid.style.display = 'block';
        if(gridTitle) gridTitle.textContent = 'The Collection';
        if(gridSub) gridSub.textContent = 'All Categories';

        // Show search bar
        let searchBar = document.getElementById('shop-search');
        if (!searchBar) {
            searchBar = document.createElement('div');
            searchBar.id = 'shop-search';
            searchBar.innerHTML = `
                <input type="text" id="search-input" placeholder="Search products..." autocomplete="off">
            `;
            const gridHeader = document.querySelector('.grid-header');
            if (gridHeader) gridHeader.after(searchBar);
        }
        searchBar.style.display = 'block';
        document.getElementById('search-input').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
            renderProducts(filtered);
            setupScrollReveal();
        });

        // Category filter clicks
        document.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const cat = link.textContent.trim();
                if (cat === 'New Arrivals' || cat === 'All') {
                    renderProducts(products);
                } else {
                    renderProducts(products.filter(p => p.category === cat));
                }
                setupScrollReveal();
            });
        });

        renderProducts(products);
        setupScrollReveal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function showAccountView() {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const acctLink = document.getElementById('account-link');
        if(acctLink) acctLink.classList.add('active');
        hideAllViews();

        let accountSection = document.getElementById('account-section');
        if (!accountSection) {
            accountSection = document.createElement('div');
            accountSection.id = 'account-section';
            document.querySelector('main').appendChild(accountSection);
        }
        accountSection.style.display = 'block';

        // Fetch orders
        let orders = [];
        try {
            const token = localStorage.getItem('zeno-token');
            const res = await fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) orders = await res.json();
        } catch(e) { /* no orders */ }

        const initials = (user.username || 'Z').slice(0,2).toUpperCase();
        const memberSince = new Date().getFullYear();

        accountSection.innerHTML = `
            <div class="account-page">
                <!-- Sidebar -->
                <aside class="account-sidebar">
                    <div class="account-avatar">${initials}</div>
                    <h3 class="account-name">${user.username}</h3>
                    <p class="account-email">${user.email}</p>
                    <p class="account-member">Member since ${memberSince}</p>
                    <nav class="account-nav">
                        <a class="account-nav-link active" data-tab="profile">Profile</a>
                        <a class="account-nav-link" data-tab="orders">Order History</a>
                        <a class="account-nav-link" data-tab="settings">Settings</a>
                    </nav>
                </aside>

                <!-- Main Content -->
                <div class="account-main">

                    <!-- Profile Tab -->
                    <div class="account-tab active" id="tab-profile">
                        <h2>My Profile</h2>
                        <p class="account-tab-sub">Your personal information</p>
                        <div class="account-info-grid">
                            <div class="info-card">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${user.username}</span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Email Address</span>
                                <span class="info-value">${user.email}</span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Member Status</span>
                                <span class="info-value">Zeno Member ✦</span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Total Orders</span>
                                <span class="info-value">${orders.length}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Orders Tab -->
                    <div class="account-tab" id="tab-orders">
                        <h2>Order History</h2>
                        <p class="account-tab-sub">Your curated purchases</p>
                        ${orders.length === 0 ? `
                            <div class="empty-state">
                                <p>No orders yet. Start exploring the collection.</p>
                                <button class="btn" style="width:auto; margin-top:1.5rem;" onclick="">Browse Shop</button>
                            </div>
                        ` : orders.map(o => `
                            <div class="order-card">
                                <div class="order-meta">
                                    <span class="order-id">Order #ZENO-${o.id}</span>
                                    <span class="order-status">Confirmed</span>
                                </div>
                                <div class="order-total">$${Number(o.total_price).toFixed(2)}</div>
                                <div class="order-date">${new Date(o.created_at).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Settings Tab -->
                    <div class="account-tab" id="tab-settings">
                        <h2>Account Settings</h2>
                        <p class="account-tab-sub">Manage your preferences</p>
                        <div class="settings-list">
                            <div class="settings-row">
                                <div>
                                    <div class="settings-label">Email Notifications</div>
                                    <div class="settings-desc">Receive updates on new arrivals and orders</div>
                                </div>
                                <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                            <div class="settings-row">
                                <div>
                                    <div class="settings-label">Newsletter</div>
                                    <div class="settings-desc">Curated lifestyle content from ZENO</div>
                                </div>
                                <label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="settings-row" style="margin-top:3rem; padding-top:2rem; border-top: 1px solid var(--border);">
                                <div>
                                    <div class="settings-label" style="color:#c0392b;">Sign Out</div>
                                    <div class="settings-desc">You will need to log in again to access your account</div>
                                </div>
                                <button class="btn btn-secondary" style="width:auto; padding: 0.6rem 1.5rem;" id="settings-logout">Logout</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Tab switching
        accountSection.querySelectorAll('.account-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                accountSection.querySelectorAll('.account-nav-link').forEach(l => l.classList.remove('active'));
                accountSection.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
                link.classList.add('active');
                const tab = document.getElementById('tab-' + link.dataset.tab);
                if (tab) tab.classList.add('active');
            });
        });

        // Browse shop button inside empty orders
        const browseBtn = accountSection.querySelector('.empty-state .btn');
        if (browseBtn) browseBtn.addEventListener('click', showShopView);

        // Settings logout
        const settingsLogout = document.getElementById('settings-logout');
        if (settingsLogout) settingsLogout.addEventListener('click', logout);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if(navHome) navHome.addEventListener('click', showHomeView);
    if(navShop) navShop.addEventListener('click', showShopView);

    // Override the generic explore button to trigger shop view
    const exploreBtn = document.querySelector('.hero-content .btn-link');
    if (exploreBtn) {
        exploreBtn.removeAttribute('onclick');
        exploreBtn.addEventListener('click', showShopView);
    }

    // Event Listeners for Base UI
    document.querySelectorAll('.open-cart').forEach(el => el.addEventListener('click', openCart));
    document.querySelector('.close-cart').addEventListener('click', closeCart);
    document.querySelector('.checkout-btn').addEventListener('click', startCheckout);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCart();
    });

    // Hotspot Action Simulation
    document.querySelectorAll('.hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            // For demo: random product view
            showProductDetails(Math.floor(Math.random() * 6) + 1);
        });
    });
});
