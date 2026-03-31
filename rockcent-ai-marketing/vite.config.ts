import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), visualizer()],
    define: {
      // API key now handled server-side via backend proxy
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') && !id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('motion')) {
                return 'motion';
              }
              if (id.includes('recharts')) {
                return 'recharts';
              }
            }
          },
        },
      },
    },
    server: {
      allowedHosts: ["ai.rockcent.com"],
      // Proxy API requests to backend server (protects API key)
      proxy: {
        '/api/ai': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
