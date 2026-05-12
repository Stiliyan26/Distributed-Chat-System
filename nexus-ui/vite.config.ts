import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const API_GATEWAY_ORIGIN = 'https://api-gateway-chat-service.onrender.com';

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_GATEWAY_ORIGIN,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
