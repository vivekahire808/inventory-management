import React, { useState } from 'react';
import { Package, Download, Bell, Volume2, VolumeX } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { exportProductsCSVUrl } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const { isConnected, unreadCount, soundEnabled, toggleSound } = useSocket();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const pageTitle = {
    dashboard: 'Inventory Dashboard',
    inventory: 'Inventory Dashboard',
    vendors: 'Vendor Management',
    'reorder-alerts': 'Reorder Alerts',
    notifications: 'Notifications',
    audit: 'Audit Logs'
  };

  return (
    <header className="top-header">
      <div className="top-header-title">
        <span className="header-icon">📦</span>
        <span>{pageTitle[activeTab] || 'Inventory Dashboard'}</span>
      </div>

      <div className="top-header-actions">
        {/* Connection status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
          background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: isConnected ? '#4ade80' : '#f87171',
          border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isConnected ? '#22c55e' : '#ef4444',
            display: 'inline-block'
          }} />
          {isConnected ? 'Connected' : 'Offline'}
        </div>

        {/* Sound toggle */}
        <button onClick={toggleSound} className="btn btn-ghost" title={soundEnabled ? 'Mute' : 'Unmute'}>
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Export CSV */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-outline btn-sm">
            <Download size={14} /> Export CSV
          </button>
          {showExportMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 6,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 8, padding: 4, zIndex: 50, minWidth: 200,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <a href={exportProductsCSVUrl} download onClick={() => setShowExportMenu(false)}
                style={{ display: 'block', padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', borderRadius: 6 }}
                onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.06)'}
                onMouseOut={e => e.target.style.background = 'transparent'}
              >
                📥 Export Inventory CSV
              </a>
            </div>
          )}
        </div>

        {/* Notifications bell */}
        <button onClick={() => setActiveTab('notifications')} className="btn btn-ghost" style={{ position: 'relative' }}>
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
