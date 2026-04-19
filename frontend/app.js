// ============================================
// COLLEGE MARKETPLACE - FRONTEND JAVASCRIPT
// Home Page: Products Display & WhatsApp Integration
// ============================================

// ============================================
// CONFIGURATION
// ============================================

// Shared API base URL from config.js.
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:5000/api';

// Storage keys for authentication
const TOKEN_KEY = 'marketplace_token';
const USER_KEY = 'marketplace_user';

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded');
    console.log('📡 API URL:', API_BASE_URL);

    // Fetch and display all products
    fetchAndDisplayProducts();

    // Attach event listeners
    attachEventListeners();

    // Check if user is logged in and update UI
    updateAuthUI();
});

// ============================================
// FETCH PRODUCTS & DISPLAY ON HOME PAGE
// ============================================

/**
 * Fetch all products from the backend API
 * GET /api/products
 * This endpoint returns all products with seller information
 */
async function fetchAndDisplayProducts() {
    console.log('📦 Fetching all products...');
    
    const container = document.getElementById('productsContainer');
    
    try {
        // Make API call to get all products
        const response = await fetch(`${API_BASE_URL}/products?limit=20`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products`);

        // Clear loading state
        container.innerHTML = '';

        // Handle empty state
        if (products.length === 0) {
            container.innerHTML = `
                <div class="error" style="background-color: #f0f9ff; border-color: #3b82f6; color: #3b82f6;">
                    📭 No products yet. Be the first to list something!
                </div>
            `;
            return;
        }

        // Render each product as a card
        products.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });

    } catch (error) {
        console.error('❌ Error fetching products:', error);
        container.innerHTML = `
            <div class="error">
                ⚠️ Failed to load products. Please refresh the page.
            </div>
        `;
    }
}

/**
 * Create a product card element
 * Structure:
 *   - Product image placeholder
 *   - Title, seller, description, price
 *   - Buy Now button (generates WhatsApp link)
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Format price with currency
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(product.price);

    // Get seller information from the joined users table
    const seller = product.users;
    const sellerName = seller.email.split('@')[0]; // Get first part of email
    const sellerPhone = seller.phone_number || 'Not provided';

    // Format date
    const createdDate = new Date(product.created_at).toLocaleDateString();
    const imageHtml = getProductImageHtml(product.image_url);

    card.innerHTML = `
        <!-- Product Image (Placeholder) -->
        ${imageHtml}

        <!-- Product Details -->
        <div class="product-body">
            <h3 class="product-title">${escapeHTML(product.title)}</h3>
            <p class="product-seller">By: <strong>${escapeHTML(sellerName)}</strong></p>
            <p class="product-description">${escapeHTML(product.description || 'No description provided')}</p>
            <p style="color: #6b7280; font-size: 0.8rem; margin-top: auto;">Posted on ${createdDate}</p>

            <!-- Product Footer: Price & Buy Button -->
            <div class="product-footer">
                <span class="product-price">${formattedPrice}</span>
                <div class="product-actions">
                    <button 
                        class="btn-buy" 
                        onclick="buyNowWhatsApp(${product.id}, '${escapeJS(product.title)}', '${sellerPhone}')"
                        title="Contact seller via WhatsApp"
                    >
                        <span class="whatsapp-icon">💬</span> Buy
                    </button>
                </div>
            </div>
        </div>
    `;

    return card;
}

function getProductImageHtml(imageUrl) {
    const safeImageUrl = getSafeImageUrl(imageUrl);
    if (!safeImageUrl) {
        return '<div class="product-image">🛍️</div>';
    }

    return `<img class="product-image product-image-real" src="${safeImageUrl}" alt="Product image" />`;
}

function getSafeImageUrl(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('data:image/')) {
        return trimmed;
    }

    return '';
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

/**
 * Generate WhatsApp link and redirect user to WhatsApp Web
 * 
 * WhatsApp URL format: https://wa.me/{phone_number}?text={message}
 * 
 * Parameters:
 *   - productId: Product ID (for reference)
 *   - productTitle: Product name to include in message
 *   - sellerPhone: Seller's phone number (international format required)
 *
 * Example:
 *   Phone: 919876543210 (without +)
 *   Message: "Hi, I am interested in Used Laptop"
 *   URL: https://wa.me/919876543210?text=Hi,%20I%20am%20interested%20in%20Used%20Laptop
 */
function buyNowWhatsApp(productId, productTitle, sellerPhone) {
    console.log(`🛒 Buy Now clicked for product: ${productTitle}`);

    // Validate seller phone number
    if (!sellerPhone || sellerPhone === 'Not provided') {
        alert('❌ Seller has not provided a phone number yet.');
        return;
    }

    // Clean phone number (remove spaces, dashes, special chars)
    // Expected format: 919876543210 (country code + number)
    const cleanPhone = sellerPhone.replace(/[\s\-\+()]/g, '');

    // Validate that it's a valid phone format
    if (!/^\d{10,15}$/.test(cleanPhone)) {
        alert('❌ Invalid seller phone number format.');
        console.error('Invalid phone:', cleanPhone);
        return;
    }

    // Create the message to send
    // Format: "Hi, I am interested in [ProductTitle]"
    const message = `Hi, I am interested in ${productTitle}`;

    // Encode the message for URL (replace spaces with %20)
    const encodedMessage = encodeURIComponent(message);

    // Build the WhatsApp URL
    // Note: wa.me is the WhatsApp web link
    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    console.log('📱 WhatsApp URL:', whatsappURL);

    // Redirect user to WhatsApp
    // Opens in new tab so user doesn't leave the marketplace
    window.open(whatsappURL, '_blank');
}

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Update UI based on authentication status
 * - Show/hide logout button
 * - Show/hide admin panel link (if user is admin)
 */
function updateAuthUI() {
    console.log('🔐 Checking authentication status...');

    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');

    const logoutBtn = document.getElementById('logoutBtn');
    const adminLink = document.querySelector('.admin-only');

    if (token && user.id) {
        console.log('✅ User logged in:', user.email);
        
        // Show logout button
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = logout;
        }

        // Show admin panel if user is admin
        if (adminLink && user.isAdmin) {
            adminLink.style.display = 'block';
        } else if (adminLink) {
            adminLink.style.display = 'none';
        }
    } else {
        console.log('❌ User not logged in');
        alert('Please log in to access full features. Redirecting...');
        window.location.href = 'login.html';
    }
}

/**
 * Logout the user
 * Clears authentication tokens from localStorage
 * Redirects to login page
 */
function logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    alert('You have been logged out.');
    window.location.href = 'login.html';
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Attach event listeners to page elements
 */
function attachEventListeners() {
    // "Post New Listing" button
    const newListingBtn = document.getElementById('newListingBtn');
    if (newListingBtn) {
        newListingBtn.addEventListener('click', () => {
            console.log('📝 New listing button clicked');
            window.location.href = 'create-listing.html';
        });
    }

    // Modal close button
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML special characters to prevent XSS attacks
 * Converts: < > & " ' to their HTML entities
 */
function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escape JavaScript strings for safe use in event handlers
 * Converts: ' " \ to escaped versions
 */
function escapeJS(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}

// ============================================
// DEBUGGING (remove in production)
// ============================================

// Log API URL for verification
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🌐 Frontend ready for requests');
console.log('💡 Tip: Open browser DevTools (F12) to see detailed logs');
