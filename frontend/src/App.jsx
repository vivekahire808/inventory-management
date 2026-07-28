import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import NotificationToast from './components/NotificationToast';
import InventoryPage from './pages/InventoryPage';
import VendorsPage from './pages/VendorsPage';
import ReorderAlertsPage from './pages/ReorderAlertsPage';
import ReordersPage from './pages/ReordersPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { SocketProvider } from './context/SocketContext';
import { getProducts, getReorders, getVendors } from './services/api';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [vendors, setVendors] = useState([]);

  const fetchProductsData = async () => {
    try {
      const res = await getProducts();
      if (res.data.success) setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchReordersData = async () => {
    try {
      const res = await getReorders();
      if (res.data.success) setReorders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reorders:', err);
    }
  };

  const fetchVendorsData = async () => {
    try {
      const res = await getVendors();
      if (res.data.success) setVendors(res.data.data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  useEffect(() => {
    fetchProductsData();
    fetchReordersData();
    fetchVendorsData();
  }, []);

  const lowStockCount = products.filter(p => p.available_quantity < p.low_stock_threshold).length;
  const reorderAlertCount = products.filter(p => p.available_quantity <= (p.threshold_limit ?? p.low_stock_threshold)).length;
  const pendingApprovalCount = reorders.filter(r => r.reorder_status === 'PENDING_APPROVAL').length;

  return (
    <div className="app-layout">
      {/* Toast Notifications */}
      <NotificationToast onNavigateToReorders={() => setActiveTab('reorders')} />

      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalCount={pendingApprovalCount}
        lowStockCount={lowStockCount}
        reorderAlertCount={reorderAlertCount}
      />

      {/* Main Area */}
      <div className="main-content">
        {/* Top Header */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Page Content */}
        <div className="page-content">
          {/* Dashboard view shows metrics + inventory */}
          {activeTab === 'dashboard' && (
            <>
              <MetricCards products={products} reorders={reorders} vendors={vendors} />
              <InventoryPage
                products={products}
                vendors={vendors}
                fetchProducts={fetchProductsData}
                fetchReorders={fetchReordersData}
                fetchVendors={fetchVendorsData}
              />
            </>
          )}

          {activeTab === 'inventory' && (
            <>
              <MetricCards products={products} reorders={reorders} vendors={vendors} />
              <InventoryPage
                products={products}
                vendors={vendors}
                fetchProducts={fetchProductsData}
                fetchReorders={fetchReordersData}
                fetchVendors={fetchVendorsData}
              />
            </>
          )}

          {activeTab === 'vendors' && (
            <VendorsPage
              vendors={vendors}
              fetchVendors={fetchVendorsData}
              fetchProducts={fetchProductsData}
            />
          )}

          {activeTab === 'reorder-alerts' && (
            <ReorderAlertsPage
              fetchReorders={fetchReordersData}
              fetchProducts={fetchProductsData}
            />
          )}

          {activeTab === 'reorders' && (
            <ReordersPage reorders={reorders} fetchReorders={fetchReordersData} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage onNavigateToReorders={() => setActiveTab('reorders')} />
          )}

          {activeTab === 'audit' && (
            <AuditLogsPage />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <DashboardContent />
    </SocketProvider>
  );
}
