const nodemailer = require('nodemailer');
const { logAudit } = require('./auditService');

/**
 * Create Nodemailer Transporter using EMAIL_USER and EMAIL_PASS
 */
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Support custom SMTP host/port or default to Gmail
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const service = process.env.EMAIL_SERVICE || (!host ? 'gmail' : undefined);

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Send low-stock notification email to Vendor
 * @param {Object} vendor Vendor record { id, name, email, phone }
 * @param {Object} product Product record { id, name, sku, available_quantity, threshold_limit, low_stock_threshold, cost_price }
 * @param {number} currentQty Current available quantity
 * @param {number} threshold Target threshold limit
 */
async function sendVendorLowStockEmail(vendor, product, currentQty, threshold) {
  try {
    if (!vendor || !vendor.email || !vendor.email.trim()) {
      console.log(`ℹ️ Vendor "${vendor?.name || 'Unknown'}" does not have an email address configured. Skipping email notification.`);
      return { success: false, reason: 'No vendor email' };
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS is not set in backend .env. Skipping vendor email notification.');
      return { success: false, reason: 'Email credentials not configured' };
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const productName = product.name;
    const productSku = product.sku;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f1117; color: #e8eaed; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #2a2d3a;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #f87171; margin: 0; font-size: 20px;">🚨 Low Stock Inventory Alert</h2>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Automated notification from Inventory Management System</p>
        </div>

        <p style="font-size: 14px; color: #e8eaed;">Dear <strong>${vendor.name}</strong>,</p>

        <p style="font-size: 14px; color: #9ca3af; line-height: 1.5;">
          This is an automated alert to inform you that stock for <strong>${productName}</strong> has dropped below the threshold limit. Please prepare for stock replenishment.
        </p>

        <div style="background-color: #1c1e2a; border: 1px solid #333648; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #9ca3af;">Product Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #ffffff;">${productName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9ca3af;">SKU Code:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #6366f1;">${productSku}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9ca3af;">Current Available Quantity:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f87171; font-size: 15px;">${currentQty} units</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9ca3af;">Reorder Threshold Limit:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">${threshold} units</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #9ca3af;">Shortfall:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #f87171;">+${Math.max(0, threshold - currentQty)} units needed</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #9ca3af;">
          Our purchasing team will process a formal reorder request shortly. If you have any updates regarding lead times or stock availability, please reply to this email.
        </p>

        <div style="border-top: 1px solid #2a2d3a; margin-top: 24px; padding-top: 12px; font-size: 11px; color: #6b7280; text-align: center;">
          Sent by Inventory System Engine &bull; ${new Date().toLocaleString()}
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Inventory Alert Engine" <${fromAddress}>`,
      to: vendor.email,
      subject: `🚨 Low Stock Alert: ${productName} (SKU: ${productSku}) - Stock below threshold (${currentQty}/${threshold})`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Vendor notification email sent successfully to ${vendor.email} (MessageID: ${info.messageId})`);

    logAudit(
      'VENDOR_EMAIL_SENT',
      `Sent low stock notification email to vendor "${vendor.name}" (${vendor.email}) for product "${productName}" (Qty: ${currentQty}, Threshold: ${threshold})`,
      'VENDOR',
      vendor.id
    );

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send vendor email notification:', err.message);
    logAudit(
      'VENDOR_EMAIL_FAILED',
      `Failed to send email to vendor "${vendor?.name || 'Unknown'}": ${err.message}`,
      'VENDOR',
      vendor?.id || null
    );
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendVendorLowStockEmail
};
