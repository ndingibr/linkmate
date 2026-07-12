import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, all API requests are proxied to the FastAPI backend at
// http://localhost:8000. In production (fly.io), the React build is served
// directly by FastAPI as static files, so all API calls are same-origin and
// no proxy is needed.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Catch-all: any path that doesn't look like a frontend asset is
      // forwarded to the local FastAPI dev server.
      '^/(search|request_quote|pay_quote|earnings|register|login|auth|profile|contact)': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
