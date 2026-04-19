# College Second-Hand Marketplace

A simple full-stack college marketplace for buying and selling used items. The project is split cleanly into a **Vercel frontend** and a **Render backend**, with **Supabase PostgreSQL** as the database.

---

## 🎯 Project Overview

**Tech Stack:**
- **Frontend:** HTML, CSS, Vanilla JavaScript (Deploy on Vercel)
- **Backend:** Node.js with Express.js (Deploy on Render)
- **Database:** PostgreSQL via Supabase

**Core Features:**
- ✅ User authentication (email/password)
- ✅ Two user roles (Student & Admin)
- ✅ Home page with all product listings
- ✅ My Listings page (user's own products)
- ✅ Admin panel (delete spam users & listings)
- ✅ WhatsApp integration for direct messaging between buyer & seller
- ✅ Settings page (update phone number)

---

## 📂 Project Structure

```
secomp/
├── database_schema.sql
├── backend/                    # Render deployment
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/                   # Vercel deployment
   ├── index.html
   ├── login.html
   ├── my-listings.html
   ├── admin.html
   ├── styles.css
   ├── app.js
   └── config.js
```

---

## 🚀 Quick Start Guide

### Step 1: Set Up Supabase Database

1. **Create a Supabase account**: https://supabase.com
2. **Create a new project** (free tier is fine)
3. **Go to SQL Editor** and run the SQL commands from `database_schema.sql`
   ```sql
   -- Copy all content from database_schema.sql and paste here
   ```
4. **Get your credentials:**
   - Go to Settings → API
   - Copy your **Project URL** (SUPABASE_URL)
   - Copy your **Anon Key** (SUPABASE_KEY)

### Step 2: Set Up Backend (Node.js/Express)

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   - Copy content from `.env.example`
   - Fill in your Supabase credentials:
     ```
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_KEY=your-anon-key
     JWT_SECRET=your-super-secret-key-min-32-chars
     PORT=5000
     ```

4. **Run the backend locally:**
   ```bash
   npm run dev
   ```
   - Server should start at `http://localhost:5000`
   - You'll see: `✅ API Server running on http://localhost:5000`

5. **Test the API:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"API is running"}
   ```

### Step 3: Set Up Frontend (HTML/CSS/JS)

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Update API URL in `frontend/config.js`:**
   - Local testing: `http://localhost:5000/api`
   - Production: replace with your Render backend URL, for example `https://your-app.onrender.com/api`

3. **Serve the frontend locally:**
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Or using Node.js http-server
   npx http-server -p 3000
   ```
   - Open: `http://localhost:3000`

---

## 📡 API Endpoints

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products (home page) |
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Log in user |

### Protected Routes (Require JWT Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/me` | Get logged-in user's products |
| `DELETE` | `/api/admin/users/:id` | **Admin only**: Delete a user |
| `DELETE` | `/api/admin/products/:id` | **Admin only**: Delete a product |

### Example: Fetch All Products

```javascript
fetch('http://localhost:5000/api/products')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
```

### Example: Login & Get Token

```javascript
fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'student@college.edu',
        password: 'password123'
    })
})
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('token', data.token);
        console.log('Logged in as:', data.user.email);
    });
```

### Example: Fetch User's Products (Protected Route)

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/products/me', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
    .then(res => res.json())
    .then(data => console.log('Your products:', data));
```

---

## 🔌 CORS Configuration

The backend allows requests from your frontend. Update the `corsOptions` in `server.js`:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',              // Local development
    'https://yourdomain.vercel.app'       // Vercel production URL
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

---

## 📱 WhatsApp Integration

When a user clicks "Buy Now", the app generates a WhatsApp link:

**URL Format:**
```
https://wa.me/{SELLER_PHONE}?text={MESSAGE}
```

**Example:**
- Seller phone: `919876543210` (with country code)
- Product: "Used Laptop"
- Generated URL: `https://wa.me/919876543210?text=Hi,%20I%20am%20interested%20in%20Used%20Laptop`

The user must provide their phone number in **Settings** for this to work.

---

## 🌐 DEPLOYMENT GUIDE

### Backend Deployment (Render)

1. **Create Render Account:** https://render.com
2. **Push code to GitHub**
3. **Create New Web Service** on Render
   - Connect your GitHub repository
   - Build command: `npm install`
   - Start command: `npm start`
4. **Set Environment Variables** in Render dashboard:
   ```
   SUPABASE_URL=...
   SUPABASE_KEY=...
   JWT_SECRET=...
   NODE_ENV=production
   ```
5. **Deploy!**
   - Render will give you a URL like: `https://college-marketplace.onrender.com`
   - Update your frontend's `API_BASE_URL` to this URL

### Frontend Deployment (Vercel)

1. **Create Vercel Account:** https://vercel.com
2. **Push code to GitHub**
3. **Import project** in Vercel
   - Select your GitHub repository
   - Set the root directory to `frontend`
4. **Edit `frontend/config.js`** before deploying so it points to your Render API URL
5. **Deploy** and note the Vercel URL
6. **Update backend CORS** to allow that Vercel URL

---

## 🔐 Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcrypt
- JWT tokens for session management
- CORS protection
- SQL injection prevention (using Supabase client)
- Input validation

⚠️ **For Production:**
- Use HTTPS everywhere
- Set `NODE_ENV=production`
- Use strong JWT_SECRET (32+ characters)
- Enable Supabase Row Level Security (RLS)
- Add rate limiting to login endpoint
- Validate phone numbers on backend

---

## 🐛 Troubleshooting

### "Cannot fetch products" error
- Check backend is running (`npm run dev`)
- Verify `API_BASE_URL` in `app.js`
- Check CORS settings in `server.js`
- Open browser DevTools (F12) → Network tab to see requests

### "CORS error" or "blocked by CORS policy"
- Make sure frontend URL is in `corsOptions` in backend
- Restart the backend server

### "Database connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check Supabase project status
- Run SQL schema again in Supabase SQL Editor

### WhatsApp link not working
- Verify seller phone number includes country code (e.g., 919876543210)
- Check phone number format: 10-15 digits
- Try opening WhatsApp link manually: `https://wa.me/919876543210`

---

## 📚 Learning Resources

- **Express.js Documentation:** https://expressjs.com
- **Supabase Guide:** https://supabase.com/docs
- **JWT Tokens:** https://jwt.io
- **WhatsApp API:** https://faq.whatsapp.com

---

## 📝 Sample Test Data

Run this SQL in Supabase to add test users & products:

```sql
-- Insert test users
INSERT INTO users (email, password_hash, phone_number, is_admin)
VALUES 
  ('admin@college.edu', '$2b$10$...(bcrypt hash)...', '919876543210', true),
  ('alice@college.edu', '$2b$10$...(bcrypt hash)...', '919111222333', false),
  ('bob@college.edu', '$2b$10$...(bcrypt hash)...', '919555666777', false);

-- Insert test products
INSERT INTO products (seller_id, title, description, price)
VALUES
  (2, 'Used Laptop', 'Dell XPS 13, i7, 8GB RAM, barely used', 500.00),
  (3, 'Calculus Textbook', 'Calculus by Stewart, 8th edition', 25.00),
  (2, 'Gaming Monitor', '27" 144Hz, perfect for gaming', 150.00);
```

---

## 👨‍💻 Developer Notes

- All code is heavily commented for learning purposes
- Use browser DevTools (F12) to debug frontend
- Use `console.log()` statements to trace execution
- Check Render/Vercel logs for backend errors
- Supabase has a built-in database browser for easy inspection

---

## 📄 License

MIT License - Feel free to use this for your college project!

---

**Questions or Issues?** Check the code comments - they explain everything! 🚀
