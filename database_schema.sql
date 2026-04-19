-- Create Users table
-- ============================================
-- COLLEGE SECOND-HAND MARKETPLACE DATABASE
-- For: Supabase PostgreSQL
-- ============================================

-- Drop tables if they exist (useful for resetting)
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores all student and admin user accounts
-- Fields:
--   - id: Unique identifier (auto-increment)
--   - email: Student email (must be unique)
--   - password_hash: Hashed password from bcrypt
--   - phone_number: WhatsApp phone number (for sellers)
--   - is_admin: Boolean flag for admin privileges
--   - created_at: Account creation timestamp

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
-- Stores all product listings
-- Fields:
--   - id: Unique product identifier
--   - seller_id: References the user who listed the product
--   - title: Product name/title
--   - description: Detailed product description
--   - image_url: Uploaded product image data
--   - price: Product price
--   - created_at: When the listing was created

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INDEXES (for better query performance)
-- ============================================
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_users_email ON users(email);

-- If products table already exists, run this once in Supabase SQL editor:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Uncomment and run to insert test users and products
-- Password: "password123" (hashed with bcrypt - replace with real hash)

-- INSERT INTO users (email, password_hash, phone_number, is_admin)
-- VALUES 
--   ('admin@college.edu', '$2b$10$examplehashedpassword', '919876543210', true),
--   ('student1@college.edu', '$2b$10$examplehashedpassword', '919123456789', false),
--   ('student2@college.edu', '$2b$10$examplehashedpassword', '919111222333', false);

-- INSERT INTO products (seller_id, title, description, price)
-- VALUES
--   (2, 'Used Laptop', 'Dell XPS 13, 8GB RAM, 256GB SSD', 500.00),
--   (3, 'calculus Textbook', 'Math textbook, barely used', 25.00);
