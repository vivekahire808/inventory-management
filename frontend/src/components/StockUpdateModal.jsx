import React, { useState, useEffect } from 'react';
import { X, Layers, AlertTriangle, Loader2 } from 'lucide-react';

export default function StockUpdateModal({ isOpen, onClose, onUpdateStock, product }) {
  const [adjustMode, setAdjustMode] = useState('set'); // 'set' or 'delta'
  const [quantityValue, setQuantityValue] = useState(0);
  const [deltaValue, setDeltaValue] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setQuantityValue(product.available_quantity);
      setDeltaValue(10);
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentAvailable = product.available_quantity;
  const threshold = product.threshold_limit ?? product.low_stock_threshold ?? 5;

  const calculatedNewStock = adjustMode === 'set'
    ? parseInt(quantityValue || 0, 10)
    : currentAvailable + parseInt(deltaValue || 0, 10);

  const isWillBeLowStock = calculatedNewStock <= threshold;

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (calculatedNewStock < 0) {
      return setError('Stock quantity cannot be negative.');
    }

    setLoading(true);
    setError('');

    try {
      if (adjustMode === 'set') {
        await onUpdateStock(product.id, { available_quantity: calculatedNewStock });
      } else {
        await onUpdateStock(product.id, { delta: parseInt(deltaValue, 10) });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Update Stock Quantity</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost"><X size={18} /></button>
        </div>

        <form onSubmit={handleStockSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12 }}>
                {error}
              </div>
            )}

            {/* Toggle Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg-input)', padding: 4, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setAdjustMode('set')}
                className={`btn btn-sm ${adjustMode === 'set' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'center' }}
              >
                Set Exact Quantity
              </button>
              <button
                type="button"
                onClick={() => setAdjustMode('delta')}
                className={`btn btn-sm ${adjustMode === 'delta' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'center' }}
              >
                Adjust (+ / - Delta)
              </button>
            </div>

            {/* Current Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Current Stock: </span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{currentAvailable} units</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Reorder Threshold: </span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#fbbf24' }}>{threshold} units</span>
              </div>
            </div>

            {adjustMode === 'set' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="form-label">New Available Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label">Adjustment Delta (+ Restock / - Decrease) *</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setDeltaValue(-5)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#f87171', fontFamily: 'monospace' }}
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeltaValue(-1)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#f87171', fontFamily: 'monospace' }}
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    className="form-input"
                    style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}
                    value={deltaValue}
                    onChange={(e) => setDeltaValue(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setDeltaValue(1)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#4ade80', fontFamily: 'monospace' }}
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeltaValue(10)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#4ade80', fontFamily: 'monospace' }}
                  >
                    +10
                  </button>
                </div>
              </div>
            )}

            {/* Forecast Banner */}
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: isWillBeLowStock ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
              border: `1px solid ${isWillBeLowStock ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
              color: isWillBeLowStock ? '#fbbf24' : '#4ade80'
            }}>
              {isWillBeLowStock ? <AlertTriangle size={18} style={{ flexShrink: 0 }} /> : <Layers size={18} style={{ flexShrink: 0 }} />}
              <div>
                <p style={{ fontWeight: 700 }}>
                  New Stock Forecast: <span style={{ fontFamily: 'monospace' }}>{calculatedNewStock} units</span>
                </p>
                <p style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                  {isWillBeLowStock
                    ? '⚠️ Stock quantity ≤ threshold. Product will show up in the Reorder Alerts section.'
                    : '✅ Stock level healthy (> threshold limit). Product will be cleared from Reorder Alerts list.'}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Stock Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
