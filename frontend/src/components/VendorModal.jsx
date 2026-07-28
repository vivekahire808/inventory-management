import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function VendorModal({ isOpen, onClose, onSave, vendor = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setError('');
  }, [vendor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError('Vendor name is required');

    setLoading(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 4 };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
          <button onClick={onClose} className="btn btn-ghost"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12 }}>
                {error}
              </div>
            )}

            <div style={fieldStyle}>
              <label className="form-label">Vendor Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Acme Tech Solutions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={fieldStyle}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div style={fieldStyle}>
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label className="form-label">Address</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Full address details..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : vendor ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
