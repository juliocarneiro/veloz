import { defineConfig } from 'tsup';

// ESM only, with shared chunks: every entry (index, jsx-runtime...) uses the
// same module instances, so runtime state is never duplicated.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ['esm'],
  target: 'es2022',
  platform: 'node',
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
});
