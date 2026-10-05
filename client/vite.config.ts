import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (
            /\/node_modules\/(recharts|recharts-scale|d3-[^/]+|react-smooth|victory-vendor)\//.test(
              id,
            )
          )
            return 'charts';
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          if (
            /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|react-is)\//.test(
              id,
            )
          )
            return 'react';
        },
      },
    },
  },
});
