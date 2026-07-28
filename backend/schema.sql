-- Inventory Management & Automated Reorder System
-- Database Schema for PostgreSQL

-- Drop tables if exists for fresh initialization
DROP TABLE IF EXISTS reorder_requests;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS vendors;

-- 1. Vendors Table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    threshold_limit INT NOT NULL DEFAULT 10 CHECK (threshold_limit >= 0),
    cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),
    supplier_name VARCHAR(255) NOT NULL DEFAULT 'Global Supplies Co.',
    category VARCHAR(100) DEFAULT 'General',
    vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reorder Requests Table
-- Statuses: PENDING_APPROVAL, PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
CREATE TABLE reorder_requests (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    unit_cost NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    reorder_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    is_high_value BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_reorders_status ON reorder_requests(reorder_status);
CREATE INDEX idx_reorders_product ON reorder_requests(product_id);

-- Initial Seed Data
INSERT INTO vendors (name, email, phone, address) VALUES
('KeyTech Supplies Ltd.', 'contact@keytech.com', '+1 (555) 101-2020', '100 Tech Blvd, Silicon Valley, CA'),
('DisplayCorp International', 'sales@displaycorp.com', '+1 (555) 303-4040', '500 Display Way, Austin, TX'),
('ComfortSeating Solutions', 'support@comfortseating.com', '+1 (555) 505-6060', '75 Ergonomic Rd, Grand Rapids, MI');

INSERT INTO products (name, sku, available_quantity, low_stock_threshold, threshold_limit, cost_price, supplier_name, category, vendor_id) VALUES
('Wireless Mechanical Keyboard', 'KB-PRO-01', 25, 10, 10, 89.99, 'KeyTech Supplies', 'Electronics', 1),
('UltraWide Gaming Monitor 34"', 'MON-UW-34', 4, 8, 8, 450.00, 'DisplayCorp International', 'Electronics', 2),
('Ergonomic Office Chair', 'CHR-ERG-99', 3, 5, 5, 199.50, 'ComfortSeating Ltd.', 'Furniture', 3),
('USB-C Docking Station 10-in-1', 'DCK-HUB-10', 45, 15, 15, 65.00, 'ConnectTech Inc.', 'Accessories', 1),
('Noise Cancelling Headphones', 'AUD-NC-700', 8, 12, 12, 280.00, 'SoundWave Audio', 'Audio', 1),
('Smart Security Camera 4K', 'CAM-SEC-4K', 2, 6, 6, 120.00, 'VisionGuard Security', 'Electronics', 2);
