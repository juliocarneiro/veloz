import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Tests run against the sources, so they never depend on a previous build.
const alias = {
  '@velozjs/core': resolve(root, 'packages/core/src/index.ts'),
  '@velozjs/dom': resolve(root, 'packages/dom/src/index.ts'),
  '@velozjs/css': resolve(root, 'packages/css/src/index.ts'),
  '@velozjs/ssr': resolve(root, 'packages/ssr/src/index.ts'),
};

const project = (name: string, environment: 'node' | 'jsdom') => ({
  resolve: { alias },
  test: {
    name,
    globals: true,
    environment,
    include: [`packages/${name}/__tests__/**/*.test.{ts,tsx}`],
  },
});

export default defineConfig({
  test: {
    projects: [
      project('core', 'node'),
      project('dom', 'jsdom'),
      project('css', 'jsdom'),
      project('ssr', 'node'),
      project('vite-plugin', 'node'),
      { test: { name: 'create-veloz', environment: 'node', include: ['packages/create-veloz/__tests__/**/*.test.ts'] } },
    ],
  },
});
