import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@type-fighter/shared': path.resolve(import.meta.dirname, '../shared/src/index.ts'),
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        ws: true
      },
      '/health': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001'
      }
    }
  }
});
