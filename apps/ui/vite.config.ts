import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const uiRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Single zod instance for UI + shared source (avoids subtle duplicate-schema issues).
    dedupe: ['zod'],
    // Bundle shared from source (per-module); avoids relying on CJS dist interop in Rollup.
    alias: {
      '@home-ai/shared': path.resolve(uiRoot, '../shared/src'),
      '@': path.resolve(uiRoot, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
