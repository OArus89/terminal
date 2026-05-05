import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
  resolve: {
    alias: {
      '@core': '/src/core',
      '@shared': '/src/shared',
    },
  },
});
