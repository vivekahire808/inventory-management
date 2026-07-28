const { supabase } = require('../db');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/vendors
 * Retrieve all vendors ordered by name
 */
exports.getAllVendors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve vendors' });
  }
};

/**
 * GET /api/vendors/:id
 * Retrieve a single vendor with associated products
 */
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Fetch associated products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, available_quantity, threshold_limit')
      .eq('vendor_id', id);

    res.json({ success: true, data: { ...vendor, products: products || [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/vendors
 * Create a new vendor
 */
exports.createVendor = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Vendor name is required' });
    }

    // Check for duplicate vendor name
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: `A vendor named "${name.trim()}" already exists.` });
    }

    const { data: insertedRows, error: insertErr } = await supabase
      .from('vendors')
      .insert([{
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null
      }])
      .select();

    if (insertErr) throw insertErr;
    const newVendor = insertedRows[0];

    logAudit('CREATE_VENDOR', `Created vendor "${newVendor.name}" (ID: ${newVendor.id})`, 'VENDOR', newVendor.id, req.ip);

    res.status(201).json({ success: true, message: 'Vendor created successfully', data: newVendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/vendors/:id
 * Update an existing vendor
 */
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const { data: existing, error: fetchErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Check for duplicate name (excluding current vendor)
    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const { data: duplicate } = await supabase
        .from('vendors')
        .select('id')
        .ilike('name', name.trim())
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        return res.status(400).json({ success: false, error: `A vendor named "${name.trim()}" already exists.` });
      }
    }

    const { data: updatedRows, error: updateErr } = await supabase
      .from('vendors')
      .update({
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? (email ? email.trim() : null) : existing.email,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
        address: address !== undefined ? (address ? address.trim() : null) : existing.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (updateErr) throw updateErr;
    const updatedVendor = updatedRows[0];

    logAudit('UPDATE_VENDOR', `Updated vendor "${updatedVendor.name}" (ID: ${id})`, 'VENDOR', id, req.ip);

    res.json({ success: true, message: 'Vendor updated successfully', data: updatedVendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/vendors/:id
 * Delete a vendor (products with this vendor will have vendor_id set to NULL)
 */
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }

    // Count associated products before deletion
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', id);

    const { error: deleteErr } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    logAudit('DELETE_VENDOR', `Deleted vendor "${existing.name}" (ID: ${id}). ${productCount || 0} product(s) unlinked.`, 'VENDOR', id, req.ip);

    res.json({
      success: true,
      message: `Vendor "${existing.name}" deleted successfully. ${productCount || 0} product(s) have been unlinked.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
