const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : '*';

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Admin connected to Socket.io: ${socket.id}`);

    socket.emit('connection-established', {
      message: 'Connected to Inventory Real-Time Notification Stream',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Admin disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
}

function notifyLowStock(product, reorder) {
  if (!io) return;
  const payload = {
    type: 'LOW_STOCK_WARNING',
    title: `⚠️ Low Stock Alert: ${product.name}`,
    message: `Product SKU [${product.sku}] quantity dropped to ${product.available_quantity} (Threshold: ${product.low_stock_threshold}).`,
    product,
    reorder,
    timestamp: new Date().toISOString()
  };
  io.emit('low-stock-alert', payload);
  console.log(`📢 Real-time low stock notification broadcasted for SKU: ${product.sku}`);
}

function notifyReorderStatusUpdate(reorder) {
  if (!io) return;
  const payload = {
    type: 'REORDER_STATUS_CHANGE',
    title: `🔄 Reorder Status Updated`,
    message: `Reorder #${reorder.id} for "${reorder.product_name}" is now [${reorder.reorder_status}].`,
    reorder,
    timestamp: new Date().toISOString()
  };
  io.emit('reorder-status-update', payload);
  console.log(`📢 Reorder #${reorder.id} status update broadcasted: ${reorder.reorder_status}`);
}

module.exports = {
  initSocket,
  getIO,
  notifyLowStock,
  notifyReorderStatusUpdate
};
