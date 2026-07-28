import React from 'react';

export default function MetricCards({ products = [], reorders = [], vendors = [] }) {
  const totalProducts = products.length;
  const reorderAlertsCount = products.filter(
    (p) => p.available_quantity <= (p.threshold_limit ?? p.low_stock_threshold)
  ).length;
  const pendingApprovals = reorders.filter((r) => r.reorder_status === 'PENDING_APPROVAL').length;
  const totalVendors = vendors.length;

  const metrics = [
    { label: 'Total Products', value: totalProducts, sub: `${totalProducts - reorderAlertsCount} stock healthy` },
    { label: 'Reorder Alerts', value: reorderAlertsCount, sub: reorderAlertsCount > 0 ? 'Stock ≤ Threshold' : 'Stock healthy' },
    { label: 'Total Vendors', value: totalVendors, sub: `${totalVendors} active suppliers` },
    { label: 'Pending Approvals', value: pendingApprovals, sub: 'OTP required' }
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <div key={i} className="metric-card">
          <span className="metric-label">{m.label}</span>
          <span className="metric-value">{m.value}</span>
          <span className="metric-sub">{m.sub}</span>
        </div>
      ))}
    </div>
  );
}
