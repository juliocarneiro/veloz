import type { Plugin, ConfigEnv } from 'vite';

export interface VelozPluginOptions {
  /** Enable HMR (default: true) */
  hmr?: boolean;
}

export default function velozPlugin(options: VelozPluginOptions = {}): Plugin {
  const { hmr: _hmr = true } = options;

  return {
    name: 'vite-plugin-veloz',
    enforce: 'pre',

    config(_config: unknown, env: ConfigEnv) {
      const isSSR = !!(env as unknown as Record<string, unknown>).isSsrBuild;
      return {
        esbuild: {
          jsx: 'automatic',
          jsxImportSource: isSSR ? '@veloz/ssr' : '@veloz/dom',
        },
        resolve: {
          dedupe: ['@veloz/core', '@veloz/dom', '@veloz/ssr'],
        },
      };
    },

    transform(code, id, transformOptions) {
      if (!transformOptions?.ssr) return;
      if (!/\.[jt]sx?(\?|$)/.test(id)) return;

      let result = code;

      if (/\.[jt]sx(\?|$)/.test(id)) {
        result = `/* @jsxImportSource @veloz/ssr */\n${result}`;
      }

      const isFramework = /[/\\]packages[/\\]/.test(id) || id.includes('node_modules/@veloz/');
      if (!isFramework) {
        result = result.replaceAll("from '@veloz/dom'", "from '@veloz/ssr'");
        result = result.replaceAll('from "@veloz/dom"', 'from "@veloz/ssr"');
      }

      if (result !== code) {
        return { code: result, map: null };
      }
    },
  };
}

export { velozPlugin };
