import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Search, Store, Mail, Phone, Layers } from 'lucide-react';
import StockUpdateModal from '../components/StockUpdateModal';
import { getReorderAlerts, updateStock } from '../services/api';

export default function ReorderAlertsPage({ fetchReorders, fetchProducts }) {
  const [reorderProducts, setReorderProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [stockUpdatingProduct, setStockUpdatingProduct] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getReorderAlerts();
      if (res.data.success) {
        setReorderProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reorder alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Extract unique vendor names for filter pills
  const vendorList = Array.from(
    new Set(reorderProducts.map((p) => p.vendor?.name || 'Unassigned').filter(Boolean))
  );

  const filteredProducts = reorderProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.vendor?.name && p.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const vendorName = p.vendor?.name || 'Unassigned';
    const matchesVendor = vendorFilter === 'ALL' || vendorName === vendorFilter;

    return matchesSearch && matchesVendor;
  });

  const handleStockUpdateSave = async (id, payload) => {
    await updateStock(id, payload);
    await fetchAlerts();
    if (fetchProducts) await fetchProducts();
    if (fetchReorders) await fetchReorders();
  };

  return (
    <div>
      <div className="page-title-row">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ color: '#f59e0b' }} size={24} />
            Reorder Alerts & Stock Replenishment
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Products with available quantity ≤ threshold limit. Update stock quantity directly here to restock products.
          </p>
        </div>
        <button onClick={fetchAlerts} disabled={loading} className="btn btn-outline btn-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Alerts
        </button>
      </div>

      {/* Filter pills for vendors */}
      {vendorList.length > 0 && (
        <div className="filter-pills">
          <button
            onClick={() => setVendorFilter('ALL')}
            className={`filter-pill ${vendorFilter === 'ALL' ? 'active' : ''}`}
          >
            All Vendors ({reorderProducts.length})
          </button>
          {vendorList.map((vName) => {
            const count = reorderProducts.filter((p) => (p.vendor?.name || 'Unassigned') === vName).length;
            return (
              <button
                key={vName}
                onClick={() => setVendorFilter(vName)}
                className={`filter-pill ${vendorFilter === vName ? 'active' : ''}`}
              >
                {vName} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <Search />
          <input
            type="text"
            className="form-input"
            placeholder="Search by product, SKU, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Low Stock Reorder List ({filteredProducts.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Threshold Limit</th>
                <th>Shortfall</th>
                <th>Cost Price</th>
                <th>Vendor Details</th>
                <th>Stock Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading reorder alerts...' : '🎉 No products currently need reordering! All inventory stock levels are healthy.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const shortfall = Math.max(0, p.threshold_limit - p.available_quantity);
                  const isOutOfStock = p.available_quantity === 0;

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {p.sku}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isOutOfStock ? '#f87171' : '#fbbf24',
                            fontSize: 14
                          }}
                        >
                          {p.available_quantity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {p.threshold_limit}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#f87171' }}>
                          +{shortfall} units
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        ₹{parseFloat(p.cost_price).toFixed(2)}
                      </td>
                      <td>
                        {p.vendor ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Store size={13} style={{ color: 'var(--accent-indigo)' }} />
                              {p.vendor.name}
                            </div>
                            {p.vendor.email && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Mail size={11} /> {p.vendor.email}
                              </div>
                            )}
                            {p.vendor.phone && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Phone size={11} /> {p.vendor.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                            {p.supplier_name || 'No Vendor Assigned'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${isOutOfStock ? 'status-out-stock' : 'status-low-stock'}`}>
                          {isOutOfStock ? 'OUT OF STOCK' : 'REORDER NEEDED'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => { setStockUpdatingProduct(p); setIsStockModalOpen(true); }}
                          className="btn btn-primary btn-sm"
                        >
                          <Layers size={13} /> Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      <StockUpdateModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onUpdateStock={handleStockUpdateSave}
        product={stockUpdatingProduct}
      />
    </div>
  );
}
