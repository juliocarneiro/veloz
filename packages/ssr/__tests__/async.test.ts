import { describe, it, expect } from 'vitest';
import { renderToStringAsync, jsx, Suspense, createResource, ErrorBoundary } from '../src/index.js';

describe('renderToStringAsync', () => {
  it('resolves data that depends on other data (several passes)', async () => {
    const App = () => {
      const [user] = createResource(async () => ({ id: 7 }));
      const [posts] = createResource(() => user()?.id, async (id) => [`post of ${id}`]);
      return jsx(Suspense, {
        fallback: 'loading',
        children: () => jsx('ul', { children: () => (posts() ?? []).map((p) => jsx('li', { children: p })) }),
      });
    };
    const { html, data } = await renderToStringAsync(() => jsx(App, {}));
    expect(html).toContain('<li data-hk');
    expect(html).toContain('post of 7');
    expect(Object.keys(data)).toHaveLength(2);
  });

  it('renders the ErrorBoundary fallback for failed data and serializes the error', async () => {
    const App = () => {
      const [v] = createResource(async () => {
        throw new Error('db down');
      });
      return jsx(ErrorBoundary, {
        fallback: (e: Error) => `failed: ${e.message}`,
        children: () => jsx(Suspense, { fallback: '…', children: () => jsx('p', { children: () => v() }) }),
      });
    };
    const { html, script } = await renderToStringAsync(() => jsx(App, {}));
    expect(html).toContain('failed: db down');
    expect(script).toContain('"message":"db down"');
  });

  it('rejects when data takes longer than the timeout', async () => {
    const App = () => {
      const [v] = createResource(() => new Promise(() => {}));
      return jsx(Suspense, { fallback: '…', children: () => jsx('p', { children: () => String(v()) }) });
    };
    await expect(renderToStringAsync(() => jsx(App, {}), { timeout: 20 })).rejects.toThrow(/timeout/);
  });

  it('adds the CSP nonce to the data script', async () => {
    const App = () => {
      const [v] = createResource(async () => 1);
      return jsx('p', { children: () => String(v()) });
    };
    const { script } = await renderToStringAsync(() => jsx(App, {}), { nonce: 'abc' });
    expect(script.startsWith('<script nonce="abc">')).toBe(true);
  });
});
