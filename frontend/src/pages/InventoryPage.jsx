import React, { useState } from 'react';
import { Plus, Search, RefreshCw, Store, Layers } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import StockUpdateModal from '../components/StockUpdateModal';
import { createProduct, updateProduct, deleteProduct, updateStock } from '../services/api';

export default function InventoryPage({ products = [], vendors = [], fetchProducts, fetchReorders, fetchVendors }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockUpdatingProduct, setStockUpdatingProduct] = useState(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.vendor?.name && p.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateOrUpdateProduct = async (formData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
    } else {
      await createProduct(formData);
    }
    await fetchProducts();
    if (fetchReorders) await fetchReorders();
    if (fetchVendors) await fetchVendors();
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(id);
        await fetchProducts();
        if (fetchReorders) await fetchReorders();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete product');
      }
    }
  };

  const handleStockUpdateSave = async (id, payload) => {
    await updateStock(id, payload);
    await fetchProducts();
    if (fetchReorders) await fetchReorders();
  };

  return (
    <div>
      {/* Page Title Row */}
      <div className="page-title-row">
        <h2 className="page-title">Inventory</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { fetchProducts(); if (fetchReorders) fetchReorders(); }} className="btn btn-outline btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <Search />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, SKU, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">Products</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Threshold</th>
                <th>Price</th>
                <th>Vendor</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.sku}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: p.available_quantity === 0 ? '#f87171'
                          : p.available_quantity <= (p.threshold_limit ?? p.low_stock_threshold) ? '#fbbf24'
                          : 'var(--text-primary)'
                      }}>
                        {p.available_quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.threshold_limit ?? p.low_stock_threshold}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{parseFloat(p.cost_price).toFixed(2)}</td>
                    <td>
                      {p.vendor ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)', fontWeight: 500 }}>
                          <Store size={13} style={{ color: 'var(--accent-indigo)' }} />
                          {p.vendor.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.supplier_name}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => { setStockUpdatingProduct(p); setIsStockModalOpen(true); }}
                        className="btn btn-warning btn-sm"
                        title="Update Stock Quantity"
                      >
                        <Layers size={13} /> Stock
                      </button>
                      <button
                        onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }}
                        className="btn btn-primary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateOrUpdateProduct}
        product={editingProduct}
        vendors={vendors}
      />
      <StockUpdateModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onUpdateStock={handleStockUpdateSave}
        product={stockUpdatingProduct}
      />
    </div>
  );
}
