import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Product API
export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post('/products', productData);
export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData);
export const updateStock = (id, stockData) => api.patch(`/products/${id}/stock`, stockData);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getReorderAlerts = () => api.get('/products/reorder-alerts');

// Vendor API
export const getVendors = () => api.get('/vendors');
export const getVendorById = (id) => api.get(`/vendors/${id}`);
export const createVendor = (vendorData) => api.post('/vendors', vendorData);
export const updateVendor = (id, vendorData) => api.put(`/vendors/${id}`, vendorData);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);

// Supplier Reorder API
export const getReorders = () => api.get('/reorders');
export const getReorderById = (id) => api.get(`/reorders/${id}`);
export const requestReorderOTP = (id) => api.post(`/reorders/${id}/request-otp`);
export const approveReorderOTP = (id, otpCode) => api.post(`/reorders/${id}/approve-otp`, { otp_code: otpCode });

// Audit Logs & Exports
export const getAuditLogs = () => api.get('/audit-logs');
export const exportProductsCSVUrl = `${API_BASE_URL}/export/products/csv`;

export default api;
