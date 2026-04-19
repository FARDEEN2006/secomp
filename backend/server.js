// ============================================
// COLLEGE SECOND-HAND MARKETPLACE API
// Node.js + Express + Supabase
// Deployment: Render
// ============================================

// DEPENDENCIES
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// INITIALIZE EXPRESS APP
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS Setup
// - Allows any localhost/127.0.0.1 port in development
// - Allows your Vercel domain in production
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  'https://yourdomain.vercel.app' // Replace with your Vercel domain
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl/Postman) and same-origin requests.
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON request bodies

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
// Create a Supabase client using your project credentials
// Get these from: Settings → API in your Supabase dashboard

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function isMissingImageColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('image_url') && (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Verify JWT token from request headers
async function verifyToken(req, res, next) {
  console.log('--- Verifying Token ---');
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    console.log('Token verified for user:', decoded.userId);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check if user has admin privileges
async function checkAdmin(req, res, next) {
  console.log('--- Checking Admin Privileges ---');
  
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Fetch user from database to verify admin status
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', req.user.userId)
      .single();

    if (error || !data || !data.is_admin) {
      console.log('Admin check failed for user:', req.user.userId);
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    console.log('Admin privileges verified');
    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    return res.status(500).json({ error: 'Server error during admin check' });
  }
}

// ============================================
// PUBLIC ROUTES
// ============================================

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// ============================================
// USER ROUTES
// ============================================

// GET /api/users/me
// Fetch logged-in user profile
app.get('/api/users/me', verifyToken, async (req, res) => {
  console.log('--- GET /api/users/me ---');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone_number, is_admin')
      .eq('id', req.user.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users
// Admin only: Fetch all users directly without inferring them from products
app.get('/api/admin/users', verifyToken, checkAdmin, async (req, res) => {
  console.log('--- GET /api/admin/users ---');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone_number, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/me
// Update logged-in user profile (email, phone number)
app.put('/api/users/me', verifyToken, async (req, res) => {
  console.log('--- PUT /api/users/me ---');

  const { email, phone_number } = req.body;

  const updates = {};
  if (email !== undefined) {
    const cleanedEmail = String(email).trim().toLowerCase();
    if (!cleanedEmail) {
      return res.status(400).json({ error: 'Email cannot be empty' });
    }
    updates.email = cleanedEmail;
  }

  if (phone_number !== undefined) {
    updates.phone_number = phone_number ? String(phone_number).trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select('id, email, phone_number, is_admin')
      .single();

    if (error) {
      console.error('Database error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully', user: data });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PRODUCT ROUTES
// ============================================

// GET /api/products
// Fetch ALL products from the database
// Used for: Home page, shopping feed
app.get('/api/products', async (req, res) => {
  console.log('--- GET /api/products ---');

  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10) || 20, 1), 100);
  
  try {
    let { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        image_url,
        price,
        created_at,
        seller_id,
        users (
          id,
          email,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error && isMissingImageColumnError(error)) {
      console.warn('image_url column missing. Falling back to products query without image_url.');
      console.warn('Run in Supabase SQL editor: ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');

      const fallbackResult = await supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          created_at,
          seller_id,
          users (
            id,
            email,
            phone_number
          )
        `)
        .order('created_at', { ascending: false });

      data = (fallbackResult.data || []).map((item) => ({
        ...item,
        image_url: null
      }));
      error = fallbackResult.error;
    }

    if (Array.isArray(data)) {
      data = data.slice(0, limit);
    }

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    console.log('Fetched', data.length, 'products');
    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products/me
// Fetch products for the logged-in user
// Requires: Valid JWT token
// Used for: My Listings page
app.get('/api/products/me', verifyToken, async (req, res) => {
  console.log('--- GET /api/products/me ---');
  
  try {
    let { data, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        image_url,
        price,
        created_at,
        seller_id
      `)
      .eq('seller_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error && isMissingImageColumnError(error)) {
      console.warn('image_url column missing. Falling back to products/me query without image_url.');
      console.warn('Run in Supabase SQL editor: ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');

      const fallbackResult = await supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          created_at,
          seller_id
        `)
        .eq('seller_id', req.user.userId)
        .order('created_at', { ascending: false });

      data = (fallbackResult.data || []).map((item) => ({
        ...item,
        image_url: null
      }));
      error = fallbackResult.error;
    }

    if (Array.isArray(data)) {
      data = data.slice(0, 100);
    }

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch your products' });
    }

    console.log('Fetched', data.length, 'products for user', req.user.userId);
    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/products
// Create a new product listing for the logged-in user
// Requires: Valid JWT token
app.post('/api/products', verifyToken, async (req, res) => {
  console.log('--- POST /api/products ---');

  const { title, description, price, image_url } = req.body;

  if (!title || price === undefined || price === null) {
    return res.status(400).json({ error: 'Title and price are required' });
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Price must be a valid positive number' });
  }

  const cleanedImageUrl = image_url ? String(image_url).trim() : null;
  if (cleanedImageUrl && !cleanedImageUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Uploaded image format is invalid' });
  }
  if (cleanedImageUrl && cleanedImageUrl.length > 3_000_000) {
    return res.status(400).json({ error: 'Image is too large. Please upload a smaller file.' });
  }

  try {
    let { data, error } = await supabase
      .from('products')
      .insert([
        {
          seller_id: req.user.userId,
          title: String(title).trim(),
          description: description ? String(description).trim() : null,
          image_url: cleanedImageUrl,
          price: parsedPrice
        }
      ])
      .select()
      .single();

    if (error && isMissingImageColumnError(error)) {
      console.warn('image_url column missing. Creating product without image_url.');
      console.warn('Run in Supabase SQL editor: ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');

      const fallbackResult = await supabase
        .from('products')
        .insert([
          {
            seller_id: req.user.userId,
            title: String(title).trim(),
            description: description ? String(description).trim() : null,
            price: parsedPrice
          }
        ])
        .select()
        .single();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    console.log('Product created:', data.id, 'by user', req.user.userId);
    res.status(201).json({ message: 'Product created successfully', product: data });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/products/:id
// Delete a product listed by the logged-in user (owner only)
// Requires: Valid JWT token
app.delete('/api/products/:id', verifyToken, async (req, res) => {
  console.log('--- DELETE /api/products/:id ---');

  const productId = parseInt(req.params.id, 10);
  if (Number.isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existingProduct.seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', req.user.userId);

    if (deleteError) {
      console.error('Database error:', deleteError.message);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    console.log('Product', productId, 'deleted by owner', req.user.userId);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/products/:id
// Update a product listed by the logged-in user (owner only)
// Requires: Valid JWT token
app.put('/api/products/:id', verifyToken, async (req, res) => {
  console.log('--- PUT /api/products/:id ---');

  const productId = parseInt(req.params.id, 10);
  if (Number.isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const { title, description, price, image_url } = req.body;

  const updates = {};
  if (title !== undefined) {
    const cleanedTitle = String(title).trim();
    if (!cleanedTitle) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    updates.title = cleanedTitle;
  }

  if (description !== undefined) {
    updates.description = description ? String(description).trim() : null;
  }

  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }
    updates.price = parsedPrice;
  }

  if (image_url !== undefined) {
    const cleanedImageUrl = image_url ? String(image_url).trim() : null;
    if (cleanedImageUrl && !cleanedImageUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Uploaded image format is invalid' });
    }
    if (cleanedImageUrl && cleanedImageUrl.length > 3_000_000) {
      return res.status(400).json({ error: 'Image is too large. Please upload a smaller file.' });
    }
    updates.image_url = cleanedImageUrl;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  try {
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existingProduct.seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    let { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('seller_id', req.user.userId)
      .select('id, title, description, image_url, price, seller_id, created_at')
      .single();

    if (error && isMissingImageColumnError(error)) {
      console.warn('image_url column missing. Updating product without image_url.');
      console.warn('Run in Supabase SQL editor: ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');

      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.image_url;

      const fallbackResult = await supabase
        .from('products')
        .update(fallbackUpdates)
        .eq('id', productId)
        .eq('seller_id', req.user.userId)
        .select('id, title, description, price, seller_id, created_at')
        .single();

      data = fallbackResult.data ? { ...fallbackResult.data, image_url: null } : fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    res.json({ message: 'Product updated successfully', product: data });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// DELETE /api/admin/users/:id
// Admin only: Delete a user account (and all their products due to CASCADE)
// Requires: Valid JWT token + Admin privileges
app.delete('/api/admin/users/:id', verifyToken, checkAdmin, async (req, res) => {
  console.log('--- DELETE /api/admin/users/:id ---');
  
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Delete the user (products will cascade delete due to FK constraint)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    console.log('User', userId, 'deleted by admin', req.user.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/products/:id
// Admin only: Delete a product listing that violates rules
// Requires: Valid JWT token + Admin privileges
app.delete('/api/admin/products/:id', verifyToken, checkAdmin, async (req, res) => {
  console.log('--- DELETE /api/admin/products/:id ---');
  
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    console.log('Product', productId, 'deleted by admin', req.user.userId);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// AUTHENTICATION ROUTES (Bonus)
// ============================================

// POST /api/auth/register
// Create a new user account
app.post('/api/auth/register', async (req, res) => {
  console.log('--- POST /api/auth/register ---');
  
  const { email, password, phone_number } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          phone_number: phone_number || null,
          is_admin: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('New user registered:', data.email);

    // Create JWT token
    const token = jwt.sign(
      { userId: data.id, email: data.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: data.id, email: data.email },
      token
    });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
// Log in a user
app.post('/api/auth/login', async (req, res) => {
  console.log('--- POST /api/auth/login ---');
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find user by email
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Database error during login:', error.message);
      return res.status(500).json({ error: 'Database connection failed during login' });
    }

    if (!data) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, data.password_hash);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: data.id, email: data.email, isAdmin: data.is_admin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('User logged in:', email);
    res.json({
      message: 'Login successful',
      user: {
        id: data.id,
        email: data.email,
        isAdmin: data.is_admin,
        phoneNumber: data.phone_number
      },
      token
    });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n✅ API Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for frontend on Vercel`);
  console.log(`📚 Database: Connected to Supabase\n`);
});
