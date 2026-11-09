import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import velozPlugin from '../src/index';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'veloz-plugin-'));
  // An app inside a monorepo "packages/" folder: must still be redirected.
  const app = join(root, 'packages', 'web', 'src');
  mkdirSync(app, { recursive: true });
  writeFileSync(join(root, 'packages', 'web', 'package.json'), JSON.stringify({ name: 'web' }));
  const lib = join(root, 'node_modules', '@veloz', 'css', 'dist');
  mkdirSync(lib, { recursive: true });
  writeFileSync(join(root, 'node_modules', '@veloz', 'css', 'package.json'), JSON.stringify({ name: '@velozjs/css' }));
  return { appFile: join(app, 'App.tsx'), libFile: join(lib, 'index.js') };
}

async function resolve(source: string, importer: string, ssr: boolean) {
  const plugin = velozPlugin() as any;
  const ctx = { resolve: vi.fn(async (id: string) => ({ id: `resolved:${id}` })) };
  const result = await plugin.resolveId.call(ctx, source, importer, { ssr });
  return result?.id ?? null;
}

describe('vite-plugin-veloz', () => {
  const { appFile, libFile } = fixture();

  it('compiles JSX with the @velozjs/dom runtime', () => {
    const config = (velozPlugin() as any).config();
    expect(config.esbuild).toMatchObject({ jsx: 'automatic', jsxImportSource: '@velozjs/dom' });
  });

  it('redirects app imports to @velozjs/ssr during SSR, even inside a monorepo packages/ folder', async () => {
    expect(await resolve('@velozjs/dom', appFile, true)).toBe('resolved:@velozjs/ssr');
    expect(await resolve('@velozjs/dom/jsx-runtime', appFile, true)).toBe('resolved:@velozjs/ssr/jsx-runtime');
    expect(await resolve('@velozjs/dom/jsx-dev-runtime', appFile, true)).toBe('resolved:@velozjs/ssr/jsx-dev-runtime');
  });

  it('leaves client builds alone', async () => {
    expect(await resolve('@velozjs/dom', appFile, false)).toBeNull();
  });

  it('leaves framework packages alone', async () => {
    expect(await resolve('@velozjs/dom', libFile, true)).toBeNull();
  });

  it('ignores other imports', async () => {
    expect(await resolve('@velozjs/core', appFile, true)).toBeNull();
  });
});
