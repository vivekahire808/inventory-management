import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw, Store, Mail, Phone, MapPin } from 'lucide-react';
import VendorModal from '../components/VendorModal';
import { createVendor, updateVendor, deleteVendor } from '../services/api';

export default function VendorsPage({ vendors = [], fetchVendors, fetchProducts }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateOrUpdateVendor = async (formData) => {
    if (editingVendor) {
      await updateVendor(editingVendor.id, formData);
    } else {
      await createVendor(formData);
    }
    await fetchVendors();
    if (fetchProducts) await fetchProducts();
  };

  const handleDeleteVendor = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}"? Associated products will have their vendor removed.`)) {
      try {
        await deleteVendor(id);
        await fetchVendors();
        if (fetchProducts) await fetchProducts();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete vendor');
      }
    }
  };

  return (
    <div>
      {/* Page Title Row */}
      <div className="page-title-row">
        <h2 className="page-title">Vendor Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fetchVendors()} className="btn btn-outline btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setEditingVendor(null); setIsVendorModalOpen(true); }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Add Vendor
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
            placeholder="Search by vendor name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Vendors Grid / Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Vendors List ({filteredVendors.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Store size={16} style={{ color: 'var(--accent-indigo)' }} />
                        <span>{v.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                      {v.email ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={13} /> {v.email}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5, fontFamily: 'monospace' }}>
                      {v.phone ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} /> {v.phone}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.address ? (
                        <span title={v.address} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {v.address}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => { setEditingVendor(v); setIsVendorModalOpen(true); }}
                        className="btn btn-primary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(v.id, v.name)}
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

      {/* Modal */}
      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSave={handleCreateOrUpdateVendor}
        vendor={editingVendor}
      />
    </div>
  );
}
