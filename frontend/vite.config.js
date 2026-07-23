import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://inventory-management-2-ux7n.onrender.com',
        changeOrigin: true
      }
    }
  }
});
