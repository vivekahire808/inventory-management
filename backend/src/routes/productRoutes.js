const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Product routes
router.get('/reorder-alerts', productController.getProductsNeedingReorder);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/stock', productController.updateStockQuantity);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
