const { supabase } = require('../db');
const { notifyLowStock } = require('../services/socketService');
const { enqueueReorderJob } = require('../services/queueService');
const { logAudit } = require('../services/auditService');
const { sendVendorLowStockEmail } = require('../services/emailService');

const HIGH_VALUE_THRESHOLD = parseFloat(process.env.HIGH_VALUE_THRESHOLD || '500.00');

async function checkAndTriggerLowStock(product, ipAddress = '127.0.0.1') {
  const available = parseInt(product.available_quantity, 10);
  const threshold = parseInt(product.threshold_limit ?? product.low_stock_threshold, 10);

  if (available < threshold) {
    console.log(`🚨 LOW STOCK DETECTED for "${product.name}" (SKU: ${product.sku}). Current: ${available}, Threshold: ${threshold}`);

    const { data: existing } = await supabase
      .from('reorder_requests')
      .select('*')
      .eq('product_id', product.id)
      .in('reorder_status', ['PENDING_APPROVAL', 'PENDING', 'PROCESSING']);

    if (existing && existing.length > 0) {
      console.log(`ℹ️ Active reorder (#${existing[0].id}) already exists for product ID ${product.id}. Skipping.`);
      notifyLowStock(product, existing[0]);
      return existing[0];
    }

    const quantityOrdered = Math.max(20, threshold * 2 - available);
    const unitCost = parseFloat(product.cost_price);
    const totalCost = parseFloat((quantityOrdered * unitCost).toFixed(2));
    const isHighValue = totalCost > HIGH_VALUE_THRESHOLD;
    const initialStatus = isHighValue ? 'PENDING_APPROVAL' : 'PENDING';

    const { data: insertedRows, error: insertErr } = await supabase
      .from('reorder_requests')
      .insert([{
        product_id: product.id,
        product_name: product.name,
        quantity_ordered: quantityOrdered,
        unit_cost: unitCost,
        total_cost: totalCost,
        supplier_name: product.supplier_name || 'Global Supplies Co.',
        reorder_status: initialStatus,
        is_high_value: isHighValue ? 1 : 0
      }])
      .select();

    if (insertErr) throw insertErr;
    const createdReorder = insertedRows[0];

    notifyLowStock(product, createdReorder);
    await sendVendorLowStockEmail(product.vendor, product, available, threshold);

    logAudit(
      'LOW_STOCK_REORDER_TRIGGERED',
      `Auto reorder #${createdReorder.id} created for "${product.name}" (Qty: ${quantityOrdered}, Cost: $${totalCost}, Status: ${initialStatus})`,
      'REORDER',
      createdReorder.id,
      ipAddress
    );

    if (!isHighValue) {
      await enqueueReorderJob(createdReorder.id);
    }

    return createdReorder;
  }

  return null;
}

exports.getAllProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(id, name, email, phone)')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(id, name, email, phone)')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name, sku, available_quantity, low_stock_threshold,
      cost_price, supplier_name, category, vendor_id, threshold_limit
    } = req.body;

    if (!name || !sku || available_quantity === undefined || low_stock_threshold === undefined || cost_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, sku, available_quantity, low_stock_threshold, cost_price'
      });
    }

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku.trim().toUpperCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: `Product with SKU "${sku}" already exists.` });
    }

    // Validate vendor_id if provided
    if (vendor_id) {
      const { data: vendorExists } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendor_id)
        .maybeSingle();
      if (!vendorExists) {
        return res.status(400).json({ success: false, error: `Vendor with ID "${vendor_id}" does not exist.` });
      }
    }

    const { data: insertedRows, error: insertErr } = await supabase
      .from('products')
      .insert([{
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        available_quantity: parseInt(available_quantity, 10),
        low_stock_threshold: parseInt(low_stock_threshold, 10),
        threshold_limit: threshold_limit !== undefined ? parseInt(threshold_limit, 10) : parseInt(low_stock_threshold, 10),
        cost_price: parseFloat(cost_price),
        supplier_name: supplier_name ? supplier_name.trim() : 'Global Supplies Co.',
        category: category ? category.trim() : 'General',
        vendor_id: vendor_id ? parseInt(vendor_id, 10) : null
      }])
      .select('*, vendor:vendors(id, name, email, phone)');

    if (insertErr) throw insertErr;
    const newProduct = insertedRows[0];

    logAudit('CREATE_PRODUCT', `Created product "${newProduct.name}" (SKU: ${newProduct.sku}, Qty: ${newProduct.available_quantity})`, 'PRODUCT', newProduct.id, req.ip);

    await checkAndTriggerLowStock(newProduct, req.ip);

    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, sku, available_quantity, low_stock_threshold,
      cost_price, supplier_name, category, vendor_id, threshold_limit
    } = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Product not found' });

    // Validate vendor_id if provided and not null
    if (vendor_id !== undefined && vendor_id !== null && vendor_id !== '') {
      const { data: vendorExists } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendor_id)
        .maybeSingle();
      if (!vendorExists) {
        return res.status(400).json({ success: false, error: `Vendor with ID "${vendor_id}" does not exist.` });
      }
    }

    const { data: updatedRows, error: updateErr } = await supabase
      .from('products')
      .update({
        name: name !== undefined ? name.trim() : existing.name,
        sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
        available_quantity: available_quantity !== undefined ? parseInt(available_quantity, 10) : existing.available_quantity,
        low_stock_threshold: low_stock_threshold !== undefined ? parseInt(low_stock_threshold, 10) : existing.low_stock_threshold,
        threshold_limit: threshold_limit !== undefined ? parseInt(threshold_limit, 10) : existing.threshold_limit,
        cost_price: cost_price !== undefined ? parseFloat(cost_price) : existing.cost_price,
        supplier_name: supplier_name !== undefined ? supplier_name.trim() : existing.supplier_name,
        category: category !== undefined ? category.trim() : existing.category,
        vendor_id: vendor_id !== undefined ? (vendor_id ? parseInt(vendor_id, 10) : null) : existing.vendor_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, vendor:vendors(id, name, email, phone)');

    if (updateErr) throw updateErr;
    const updatedProduct = updatedRows[0];

    logAudit('UPDATE_PRODUCT', `Updated product "${updatedProduct.name}" (SKU: ${updatedProduct.sku})`, 'PRODUCT', id, req.ip);

    await checkAndTriggerLowStock(updatedProduct, req.ip);

    res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { available_quantity, delta } = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Product not found' });

    let newQuantity;
    if (delta !== undefined) {
      newQuantity = existing.available_quantity + parseInt(delta, 10);
    } else if (available_quantity !== undefined) {
      newQuantity = parseInt(available_quantity, 10);
    } else {
      return res.status(400).json({ success: false, error: 'Provide available_quantity or delta' });
    }

    if (newQuantity < 0) {
      return res.status(400).json({ success: false, error: 'Available stock quantity cannot be negative' });
    }

    const prevQty = existing.available_quantity;

    const { data: updatedRows, error: updateErr } = await supabase
      .from('products')
      .update({ available_quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, vendor:vendors(id, name, email, phone)');

    if (updateErr) throw updateErr;
    const updatedProduct = updatedRows[0];

    logAudit('STOCK_UPDATE', `Updated stock for "${updatedProduct.name}" from ${prevQty} to ${newQuantity} units`, 'PRODUCT', id, req.ip);

    const triggeredReorder = await checkAndTriggerLowStock(updatedProduct, req.ip);

    res.json({
      success: true,
      message: `Stock updated for ${updatedProduct.name}`,
      data: updatedProduct,
      reorderTriggered: !!triggeredReorder,
      reorder: triggeredReorder
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Product not found' });

    const { error: deleteErr } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    logAudit('DELETE_PRODUCT', `Deleted product "${existing.name}" (ID: ${id})`, 'PRODUCT', id, req.ip);

    res.json({ success: true, message: `Product "${existing.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/products/reorder-alerts
 * Returns products where available_quantity <= threshold_limit (and threshold_limit > 0)
 */
exports.getProductsNeedingReorder = async (req, res) => {
  try {
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*, vendor:vendors(id, name, email, phone)')
      .gt('threshold_limit', 0)
      .order('available_quantity', { ascending: true });

    if (error) throw error;

    // Filter: available_quantity <= threshold_limit
    const productsNeedingReorder = allProducts.filter(
      p => parseInt(p.available_quantity, 10) <= parseInt(p.threshold_limit, 10)
    );

    res.json({
      success: true,
      count: productsNeedingReorder.length,
      data: productsNeedingReorder
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve reorder alerts' });
  }
};
