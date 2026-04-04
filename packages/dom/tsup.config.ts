import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/jsx-runtime.ts', 'src/jsx-dev-runtime.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
});
