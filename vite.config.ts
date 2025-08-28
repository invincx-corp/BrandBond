import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/src/backend/**'],
    },
    hmr: {
      overlay: true,
    },
    open: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    watch: {
      include: 'src/**',
      exclude: 'src/backend/**',
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  clearScreen: false,
  logLevel: 'info',
});
