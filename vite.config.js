import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When VITE_USE_MOCK=false, requests to /api are forwarded to the FastAPI backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.BACKEND_URL || 'http://localhost:8000', changeOrigin: true },
    },
  },
});
