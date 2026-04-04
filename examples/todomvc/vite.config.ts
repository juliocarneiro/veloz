import { defineConfig } from 'vite';
import velozPlugin from 'vite-plugin-veloz';
import path from 'path';

export default defineConfig({
  plugins: [velozPlugin()],
  resolve: {
    alias: [
      { find: '@veloz/dom/jsx-dev-runtime', replacement: path.resolve(__dirname, '../../packages/dom/src/jsx-dev-runtime.ts') },
      { find: '@veloz/dom/jsx-runtime', replacement: path.resolve(__dirname, '../../packages/dom/src/jsx-runtime.ts') },
      { find: '@veloz/core', replacement: path.resolve(__dirname, '../../packages/core/src/index.ts') },
      { find: '@veloz/dom', replacement: path.resolve(__dirname, '../../packages/dom/src/index.ts') },
      { find: '@veloz/css', replacement: path.resolve(__dirname, '../../packages/css/src/index.ts') },
    ],
  },
});
