require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const reorderRoutes = require('./routes/reorderRoutes');
const auditRoutes = require('./routes/auditRoutes');
const exportRoutes = require('./routes/exportRoutes');
const rateLimiter = require('./middleware/rateLimiter');
const { initSocket } = require('./services/socketService');
const { initQueue } = require('./services/queueService');

const app = express();
const server = http.createServer(app);

// Middleware
const corsOptions = process.env.FRONTEND_URL
  ? { origin: [process.env.FRONTEND_URL, 'http://localhost:5173'], credentials: true }
  : {};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to all API routes
app.use('/api', rateLimiter(120, 60 * 1000));

// Initialize Socket.io
initSocket(server);

// Initialize Background Job Queue (BullMQ with Fallback)
initQueue();

// Production Health & System Readiness API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'Inventory & Automated Reorder Enterprise Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/reorders', reorderRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/export', exportRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Inventory Enterprise API Server running on port ${PORT}`);
  console.log(`📡 Real-time WebSockets active via Socket.io`);
  console.log(`=======================================================`);
});
