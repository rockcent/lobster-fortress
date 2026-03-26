import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { registerRoutes } from './server/routes';

export default defineConfig({
  server: {
    port: 4310,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    {
      name: 'openclaw-console-api',
      configureServer(server) {
        registerRoutes(server);
      },
    },
  ],
});
