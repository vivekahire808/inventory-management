-- Migration 002: Add Vendors table, threshold_limit column, and vendor_id relationship to products

-- 1. Create Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add threshold_limit and vendor_id to Products Table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS threshold_limit INT NOT NULL DEFAULT 10 CHECK (threshold_limit >= 0),
  ADD COLUMN IF NOT EXISTS vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL;

-- 3. Populate existing threshold_limit from low_stock_threshold
UPDATE products
SET threshold_limit = low_stock_threshold
WHERE threshold_limit = 0 OR threshold_limit IS NULL;

-- 4. Create Index on vendor_id
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
