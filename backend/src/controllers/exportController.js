const { supabase } = require('../db');

/**
 * Export products inventory as CSV
 */
exports.exportProductsCSV = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(name)')
      .order('id', { ascending: true });

    if (error) throw error;

    let csvContent = 'ID,Product Name,SKU,Available Quantity,Low Stock Limit,Threshold Limit,Cost Price (₹),Supplier Name,Vendor Name,Category,Created Date\n';

    products.forEach((p) => {
      const name = `"${(p.name || '').replace(/"/g, '""')}"`;
      const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
      const supplier = `"${(p.supplier_name || '').replace(/"/g, '""')}"`;
      const vendorName = `"${(p.vendor?.name || '').replace(/"/g, '""')}"`;
      const category = `"${(p.category || 'General').replace(/"/g, '""')}"`;
      const cost = parseFloat(p.cost_price || 0).toFixed(2);
      const created = `"${new Date(p.created_at).toISOString()}"`;
      csvContent += `${p.id},${name},${sku},${p.available_quantity},${p.low_stock_threshold},${p.threshold_limit || 0},${cost},${supplier},${vendorName},${category},${created}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Export supplier reorders as CSV
 */
exports.exportReordersCSV = async (req, res) => {
  try {
    const { data: reorders, error } = await supabase
      .from('reorder_requests')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    let csvContent = 'Reorder ID,Product ID,Product Name,Quantity Ordered,Unit Cost ($),Total Cost ($),Supplier Name,Status,Is High Value,Created Date\n';

    reorders.forEach((r) => {
      const name = `"${(r.product_name || '').replace(/"/g, '""')}"`;
      const supplier = `"${(r.supplier_name || '').replace(/"/g, '""')}"`;
      const unitCost = parseFloat(r.unit_cost || 0).toFixed(2);
      const totalCost = parseFloat(r.total_cost || 0).toFixed(2);
      const created = `"${new Date(r.created_at).toISOString()}"`;
      csvContent += `${r.id},${r.product_id},${name},${r.quantity_ordered},${unitCost},${totalCost},${supplier},${r.reorder_status},${r.is_high_value ? 'YES' : 'NO'},${created}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="supplier_reorders_export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
