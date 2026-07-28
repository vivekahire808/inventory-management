import React from 'react';
import { LayoutDashboard, Boxes, Store, AlertTriangle, Truck, Bell, ScrollText } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Sidebar({ activeTab, setActiveTab, pendingApprovalCount, lowStockCount, reorderAlertCount }) {
  const { unreadCount } = useSocket();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'reorder-alerts', label: 'Reorder Alerts', icon: AlertTriangle, badge: reorderAlertCount > 0 ? reorderAlertCount : null },
    { id: 'reorders', label: 'Supplier Reorders', icon: Truck, badge: pendingApprovalCount > 0 ? pendingApprovalCount : null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Inventory System</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
