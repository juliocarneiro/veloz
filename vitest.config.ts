import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          globals: true,
          environment: 'node',
          include: ['packages/core/__tests__/**/*.test.ts'],
        },
      },
      {
        resolve: {
          alias: {
            '@veloz/core': resolve(__dirname, 'packages/core/src/index.ts'),
          },
        },
        test: {
          name: 'dom',
          globals: true,
          environment: 'jsdom',
          include: ['packages/dom/__tests__/**/*.test.{ts,tsx}'],
        },
      },
      {
        resolve: {
          alias: {
            '@veloz/core': resolve(__dirname, 'packages/core/src/index.ts'),
            '@veloz/dom': resolve(__dirname, 'packages/dom/src/index.ts'),
            '@veloz/css': resolve(__dirname, 'packages/css/src/index.ts'),
          },
        },
        test: {
          name: 'css',
          globals: true,
          environment: 'jsdom',
          include: ['packages/css/__tests__/**/*.test.{ts,tsx}'],
        },
      },
      {
        resolve: {
          alias: {
            '@veloz/core': resolve(__dirname, 'packages/core/src/index.ts'),
            '@veloz/css': resolve(__dirname, 'packages/css/src/index.ts'),
            '@veloz/ssr': resolve(__dirname, 'packages/ssr/src/index.ts'),
          },
        },
        test: {
          name: 'ssr',
          globals: true,
          environment: 'node',
          include: ['packages/ssr/__tests__/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
