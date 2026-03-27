import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['motion'],
            'vendor-charts': ['recharts'],
            'vendor-markdown': ['react-markdown'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Proxy API requests to Express backend during development
      proxy: {
        '/api': {
          target: `http://localhost:${env.AI_PROXY_PORT || 3001}`,
          changeOrigin: true,
        },
      },
    },
  };
});
