# Inventory Management & Automated Reorder System

An enterprise-grade, full-stack **Inventory Management & Automated Reorder System** built with Node.js/Express REST APIs, Socket.io real-time WebSockets, BullMQ + Redis background job processing, PostgreSQL/SQLite database layer, OTP-based high-value order authorization, and a Vite + React admin dashboard.

---

## 📁 Submission Deliverables

- **Backend Application**: Located in `/backend` (Express REST APIs, Socket.io WebSockets, BullMQ Queue, Database Layer).
- **Frontend Application**: Located in `/frontend` (Vite + React 18, Glassmorphism Dark Theme, Lucide Icons, Socket.io Client).
- **Database Schema & Migrations**:
  - PostgreSQL Schema DDL: `backend/schema.sql`
  - PostgreSQL Migration File: `backend/migrations/001_init.sql`
  - Prisma Schema File: `backend/prisma/schema.prisma`
- **Environment Configuration Examples**:
  - `backend/.env.example`
  - `frontend/.env.example`
- **Setup Instructions & Documentation**: Included below in this `README.md`.

---

## ⚙️ Architecture & Features

```
 ┌─────────────────────────────────────────────────────────┐
 │               React Admin Dashboard (Port 5173)         │
 │  (Inventory Table, Reorder Logs, Live Notifications)    │
 └─────────────┬─────────────────────────────▲─────────────┘
               │ HTTP REST APIs              │ Socket.io WebSockets
               ▼                             │ Real-Time Broadcasts
 ┌───────────────────────────────────────────┴─────────────┐
 │              Node.js Express Backend (Port 5000)        │
 │  (Products, Auto Reorders, OTP Verification Engine)     │
 └──────────────┬───────────────────────────┬──────────────┘
                │ SQL Engine                │ Background Queue
                ▼                           ▼
 ┌───────────────────────────┐ ┌───────────────────────────┐
 │   PostgreSQL / SQLite DB  │ │  BullMQ + Redis Worker    │
 │ (Products & Reorders DB)  │ │ (Async Supplier Reorders) │
 └───────────────────────────┘ └───────────────────────────┘
```

1. **Inventory Management Module**
   - Add new products with SKU, available quantity, low-stock threshold, cost price, supplier name, and category.
   - View, update product details, and delete products.
   - Quick stock adjustment controls (+ / - delta or exact set quantity).
   - Real-time stock status badge indication (`In Stock`, `Low Stock`, `Out of Stock`).

2. **Automated Low-Stock Detection**
   - Whenever stock drops below a product's configured `low_stock_threshold`:
     - System detects low-stock condition automatically.
     - Triggers real-time notification to connected admins via Socket.io.
     - Initiates automated supplier reorder process.

3. **High-Value Order Approval (OTP Authorization)**
   - If total reorder value exceeds **$500.00** (`quantity_ordered * cost_price > threshold`):
     - Marks reorder status as `PENDING_APPROVAL`.
     - Requires 6-digit OTP code verification before approval.
     - Upon valid OTP verification, reorder status changes to `PENDING` and job is enqueued for background processing.

4. **Background Job Queue Processing (BullMQ + Redis)**
   - Processes supplier reorder requests asynchronously outside the API request-response cycle.
   - Configured with retry attempts (3 retries with exponential backoff) and explicit error handling.
   - If supplier communication fails, marks status as `FAILED` and broadcasts alert over WebSockets.

5. **Real-Time Notification Stream**
   - Socket.io WebSockets push real-time alerts and reorder status progression to the dashboard without page refreshes.

---

## ⚡ Quick Start Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

### 3. Start Backend API & Worker Server

```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000`.*

### 4. Start Frontend Admin Dashboard

```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all inventory products with vendor info |
| `POST` | `/api/products` | Create a new product (with vendor_id & threshold_limit) |
| `GET` | `/api/products/reorder-alerts` | Retrieve products where stock quantity $\le$ threshold_limit |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `PUT` | `/api/products/:id` | Update product details |
| `PATCH` | `/api/products/:id/stock` | Update stock quantity (Triggers low stock detection) |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/vendors` | Retrieve all vendors |
| `POST` | `/api/vendors` | Create a new vendor |
| `GET` | `/api/vendors/:id` | Retrieve vendor details with associated products |
| `PUT` | `/api/vendors/:id` | Update vendor details |
| `DELETE` | `/api/vendors/:id` | Delete vendor (unlinks vendor from associated products) |
| `GET` | `/api/reorders` | Retrieve all supplier reorder requests |
| `GET` | `/api/reorders/:id` | Retrieve reorder request details |
| `POST` | `/api/reorders/:id/request-otp` | Request 6-digit OTP for high-value reorder |
# Inventory Management & Automated Reorder System

An enterprise-grade, full-stack **Inventory Management & Automated Reorder System** built with Node.js/Express REST APIs, Socket.io real-time WebSockets, BullMQ + Redis background job processing, PostgreSQL/SQLite database layer, OTP-based high-value order authorization, and a Vite + React admin dashboard.

---

## 📁 Submission Deliverables

- **Backend Application**: Located in `/backend` (Express REST APIs, Socket.io WebSockets, BullMQ Queue, Database Layer).
- **Frontend Application**: Located in `/frontend` (Vite + React 18, Glassmorphism Dark Theme, Lucide Icons, Socket.io Client).
- **Database Schema & Migrations**:
  - PostgreSQL Schema DDL: `backend/schema.sql`
  - PostgreSQL Migration File: `backend/migrations/001_init.sql`
  - Prisma Schema File: `backend/prisma/schema.prisma`
- **Environment Configuration Examples**:
  - `backend/.env.example`
  - `frontend/.env.example`
- **Setup Instructions & Documentation**: Included below in this `README.md`.

---

## ⚙️ Architecture & Features

```
 ┌─────────────────────────────────────────────────────────┐
 │               React Admin Dashboard (Port 5173)         │
 │  (Inventory Table, Reorder Logs, Live Notifications)    │
 └─────────────┬─────────────────────────────▲─────────────┘
               │ HTTP REST APIs              │ Socket.io WebSockets
               ▼                             │ Real-Time Broadcasts
 ┌───────────────────────────────────────────┴─────────────┐
 │              Node.js Express Backend (Port 5000)        │
 │  (Products, Auto Reorders, OTP Verification Engine)     │
 └──────────────┬───────────────────────────┬──────────────┘
                │ SQL Engine                │ Background Queue
                ▼                           ▼
 ┌───────────────────────────┐ ┌───────────────────────────┐
 │   PostgreSQL / SQLite DB  │ │  BullMQ + Redis Worker    │
 │ (Products & Reorders DB)  │ │ (Async Supplier Reorders) │
 └───────────────────────────┘ └───────────────────────────┘
```

1. **Inventory Management Module**
   - Add new products with SKU, available quantity, low-stock threshold, cost price, supplier name, and category.
   - View, update product details, and delete products.
   - Quick stock adjustment controls (+ / - delta or exact set quantity).
   - Real-time stock status badge indication (`In Stock`, `Low Stock`, `Out of Stock`).

2. **Automated Low-Stock Detection**
   - Whenever stock drops below a product's configured `low_stock_threshold`:
     - System detects low-stock condition automatically.
     - Triggers real-time notification to connected admins via Socket.io.
     - Initiates automated supplier reorder process.

3. **High-Value Order Approval (OTP Authorization)**
   - If total reorder value exceeds **$500.00** (`quantity_ordered * cost_price > threshold`):
     - Marks reorder status as `PENDING_APPROVAL`.
     - Requires 6-digit OTP code verification before approval.
     - Upon valid OTP verification, reorder status changes to `PENDING` and job is enqueued for background processing.

4. **Background Job Queue Processing (BullMQ + Redis)**
   - Processes supplier reorder requests asynchronously outside the API request-response cycle.
   - Configured with retry attempts (3 retries with exponential backoff) and explicit error handling.
   - If supplier communication fails, marks status as `FAILED` and broadcasts alert over WebSockets.

5. **Real-Time Notification Stream**
   - Socket.io WebSockets push real-time alerts and reorder status progression to the dashboard without page refreshes.

---

## ⚡ Quick Start Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

### 3. Start Backend API & Worker Server

```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000`.*

### 4. Start Frontend Admin Dashboard

```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all inventory products with vendor info |
| `POST` | `/api/products` | Create a new product (with vendor_id & threshold_limit) |
| `GET` | `/api/products/reorder-alerts` | Retrieve products where stock quantity $\le$ threshold_limit |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `PUT` | `/api/products/:id` | Update product details |
| `PATCH` | `/api/products/:id/stock` | Update stock quantity (Triggers low stock detection) |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/vendors` | Retrieve all vendors |
| `POST` | `/api/vendors` | Create a new vendor |
| `GET` | `/api/vendors/:id` | Retrieve vendor details with associated products |
| `PUT` | `/api/vendors/:id` | Update vendor details |
| `DELETE` | `/api/vendors/:id` | Delete vendor (unlinks vendor from associated products) |
| `GET` | `/api/reorders` | Retrieve all supplier reorder requests |
| `GET` | `/api/reorders/:id` | Retrieve reorder request details |
| `POST` | `/api/reorders/:id/request-otp` | Request 6-digit OTP for high-value reorder |
| `POST` | `/api/reorders/:id/approve-otp` | Approve pending reorder using OTP verification |

---

## 🗄️ Database Migration Commands

### Supabase SQL Migration Instructions

Copy and run the SQL below in your **Supabase Dashboard -> SQL Editor**:

```sql
-- 1. Create Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) UNIQUE NOT NULL,
    email       VARCHAR(255),
    phone       VARCHAR(50),
    address     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add threshold_limit and vendor_id to Products Table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS threshold_limit INT NOT NULL DEFAULT 10 CHECK (threshold_limit >= 0),
  ADD COLUMN IF NOT EXISTS vendor_id INT REFERENCES vendors(id) ON DELETE SET NULL;

-- 3. Sync initial threshold_limit values
UPDATE products
SET threshold_limit = low_stock_threshold
WHERE threshold_limit = 0 OR threshold_limit IS NULL;

-- 4. Create Index on vendor_id
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
```
