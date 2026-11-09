import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { version as viteVersion, type Plugin, type UserConfig } from 'vite';

function majorOf(version: string | undefined): number {
  return Number.parseInt(version ?? '', 10) || 0;
}
const JSX_IMPORT_SOURCE = '@velozjs/dom';

export interface VelozPluginOptions {
  /**
   * Package names whose imports of `@velozjs/dom` are left alone during SSR.
   * Packages named `@velozjs/*` are always excluded.
   */
  exclude?: string[];
}

/** During SSR, these client modules resolve to their server counterparts. */
const SSR_REDIRECTS: Record<string, string> = {
  '@velozjs/dom': '@velozjs/ssr',
  '@velozjs/dom/jsx-runtime': '@velozjs/ssr/jsx-runtime',
  '@velozjs/dom/jsx-dev-runtime': '@velozjs/ssr/jsx-dev-runtime',
};

const packageNameCache = new Map<string, string | null>();

/** Name of the nearest package.json above `file` (cached per directory). */
function packageNameOf(file: string): string | null {
  const path = file.split('?')[0].replace(/^\0/, '');
  let dir = dirname(path);
  const visited: string[] = [];
  let name: string | null = null;

  for (;;) {
    const cached = packageNameCache.get(dir);
    if (cached !== undefined) {
      name = cached;
      break;
    }
    visited.push(dir);
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        name = (JSON.parse(readFileSync(pkg, 'utf8')) as { name?: string }).name ?? null;
      } catch {
        name = null;
      }
      break;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  for (const d of visited) packageNameCache.set(d, name);
  return name;
}

/**
 * Veloz for Vite: compiles JSX with the `@velozjs/dom` runtime, and during SSR
 * (dev `ssrLoadModule` and `vite build --ssr`) resolves app imports of
 * `@velozjs/dom` to `@velozjs/ssr`, so the same components render to HTML.
 */
export default function velozPlugin(options: VelozPluginOptions = {}): Plugin {
  const exclude = new Set(options.exclude ?? []);

  const isFrameworkModule = (importer: string | undefined): boolean => {
    if (!importer) return false;
    const name = packageNameOf(importer);
    return name != null && (name.startsWith('@velozjs/') || exclude.has(name));
  };

  return {
    name: 'vite-plugin-veloz',
    enforce: 'pre',

    config() {
      // Vite 8 transforms with Oxc; earlier versions with esbuild. Ask the Vite
      // that is running (this.meta, Vite 7+): the imported `vite` can be another
      // copy, e.g. in a monorepo or when this plugin is linked.
      const running = (this as { meta?: { viteVersion?: string } } | undefined)?.meta?.viteVersion;
      const jsx =
        majorOf(running ?? viteVersion) >= 8
          ? { oxc: { jsx: { runtime: 'automatic', importSource: JSX_IMPORT_SOURCE } } }
          : { esbuild: { jsx: 'automatic', jsxImportSource: JSX_IMPORT_SOURCE } };
      return {
        ...jsx,
        resolve: { dedupe: ['@velozjs/core', '@velozjs/dom', '@velozjs/css', '@velozjs/ssr'] },
        // Externalized dependencies are loaded by Node directly and never reach
        // resolveId, so @velozjs/dom imports could not be redirected. Processing
        // dom and ssr through Vite also keeps a single copy of the SSR runtime.
        ssr: { noExternal: ['@velozjs/dom', '@velozjs/ssr'] },
      } as UserConfig;
    },

    async resolveId(source, importer, resolveOptions) {
      if (!resolveOptions?.ssr) return null;
      const target = SSR_REDIRECTS[source];
      if (!target || isFrameworkModule(importer)) return null;
      return this.resolve(target, importer, { ...resolveOptions, skipSelf: true });
    },
  };
}

export { velozPlugin };
