import { describe, it, expect, vi } from 'vitest';
import { renderToString, jsx, createEffect, onMount, createSignal, createMemo } from '../src/index.js';

describe('server-only behavior', () => {
  it('createEffect and onMount do not run during SSR (browser APIs are safe in them)', () => {
    const effect = vi.fn();
    const mounted = vi.fn();
    const App = () => {
      createEffect(() => {
        effect();
        (globalThis as any).window.title = 'x'; // would throw on the server
      });
      onMount(mounted);
      return jsx('p', { children: 'ok' });
    };
    expect(renderToString(() => jsx(App, {})).html).toBe('<p data-hk="0">ok</p>');
    return Promise.resolve().then(() => {
      expect(effect).not.toHaveBeenCalled();
      expect(mounted).not.toHaveBeenCalled();
    });
  });

  it('memos still compute on the server', () => {
    const App = () => {
      const [n] = createSignal(2);
      const double = createMemo(() => n() * 2);
      return jsx('p', { children: () => double() });
    };
    expect(renderToString(() => jsx(App, {})).html).toContain('4');
  });

  it('a render nested inside another keeps the outer hydration keys in order', () => {
    let inner = '';
    const Island = () => {
      inner = renderToString(() => jsx('b', { children: 'island' })).html;
      return jsx('span', {});
    };
    const { html } = renderToString(() => jsx('main', { children: [jsx('i', {}), jsx(Island, {}), jsx('u', {})] }));
    expect(inner).toBe('<b data-hk="0">island</b>');
    expect(html).toBe('<main data-hk="3"><i data-hk="0"></i><span data-hk="1"></span><u data-hk="2"></u></main>');
  });

  it('style objects add px to numbers', () => {
    const { html } = renderToString(() => jsx('div', { style: { padding: 8, opacity: 0.5, '--x': 2 } }));
    expect(html).toContain('style="padding:8px;opacity:0.5;--x:2"');
  });

  it('markers are shared across copies of the SSR runtime (Symbol.for)', () => {
    const raw = jsx('p', {});
    expect(Object.getOwnPropertySymbols(raw)).toContain(Symbol.for('veloz.raw-html'));
  });
});
