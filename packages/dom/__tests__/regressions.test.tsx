import { describe, it, expect, vi } from 'vitest';
import { render } from '../src/render';
import { hydrate } from '../src/hydrate';
import { createElement as h } from '../src/jsx-runtime';
import { Show } from '../src/components/Show';
import { Switch, Match } from '../src/components/Switch';
import { For } from '../src/components/For';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Portal } from '../src/components/Portal';
import { sanitizeURL, validateAttribute } from '../src/security';
import { sanitize } from '../src/sanitizer';
import { createSignal, createEffect, createContext, useContext } from '@velozjs/core';

const mount = () => {
  const c = document.createElement('div');
  document.body.appendChild(c);
  return c;
};

describe('children', () => {
  it('reactive child returning an array renders the nodes', () => {
    const c = mount();
    render(() => h('div', null, () => [h('b', null, 'x'), h('i', null, 'y')]), c);
    expect(c.textContent).toBe('xy');
  });

  it('switching between text, nodes and nothing cleans up', () => {
    const c = mount();
    const [v, setV] = createSignal<unknown>('a');
    render(() => h('p', null, 'pre ', () => v(), ' post'), c);
    expect(c.textContent).toBe('pre a post');
    setV([h('b', null, '1'), h('b', null, '2')]);
    expect(c.querySelectorAll('b').length).toBe(2);
    setV(null);
    expect(c.textContent).toBe('pre  post');
  });

  it('svg children are created in the SVG namespace', () => {
    const c = mount();
    render(() => h('svg', { viewBox: '0 0 24 24' }, h('path', { d: 'M0 0L24 24' })), c);
    expect(c.querySelector('path')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });
});

describe('props', () => {
  it('callback props are passed through, not invoked', () => {
    const c = mount();
    let got: unknown;
    const Comp = (p: { format: (n: number) => number }) => {
      got = p.format;
      return h('span', null, 'ok');
    };
    render(() => h(Comp as any, { format: (n: number) => n * 2 }), c);
    expect(typeof got).toBe('function');
  });

  it('ref objects receive the element', () => {
    const c = mount();
    const ref = { current: null as Element | null };
    render(() => h('input', { ref }), c);
    expect(ref.current).toBe(c.querySelector('input'));
  });

  it('style objects drop properties that disappear', () => {
    const c = mount();
    const [s, setS] = createSignal<Record<string, string>>({ color: 'red', marginTop: '4px' });
    render(() => h('div', { style: () => s() }), c);
    setS({ color: 'blue' });
    const el = c.firstElementChild as HTMLElement;
    expect(el.style.color).toBe('blue');
    expect(el.style.marginTop).toBe('');
  });

  it('aria booleans become "true"/"false" strings', () => {
    const c = mount();
    render(() => h('button', { 'aria-pressed': true, 'aria-hidden': false }), c);
    const el = c.firstElementChild!;
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('events', () => {
  it('focus (non-bubbling) handlers fire', () => {
    const c = mount();
    const fn = vi.fn();
    render(() => h('input', { onFocus: fn }), c);
    c.querySelector('input')!.dispatchEvent(new FocusEvent('focus'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('mouseenter handlers fire', () => {
    const c = mount();
    const fn = vi.fn();
    render(() => h('div', { onMouseEnter: fn }), c);
    c.firstElementChild!.dispatchEvent(new MouseEvent('mouseenter'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('delegated handlers fire once and see currentTarget', () => {
    const c = mount();
    let target: unknown;
    const fn = vi.fn((e: Event) => {
      target = e.currentTarget;
    });
    render(() => h('button', { onClick: fn }, h('span', null, 'x')), c);
    c.querySelector('span')!.click();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(target).toBe(c.querySelector('button'));
  });

  it('events work inside Portals', () => {
    const c = mount();
    const target = mount();
    const fn = vi.fn();
    render(() => h(Portal as any, { mount: target, children: () => h('button', { onClick: fn }, 'p') }), c);
    target.querySelector('button')!.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('control flow', () => {
  it('Switch renders on first render and follows changes', () => {
    const c = mount();
    const [route, setRoute] = createSignal('a');
    render(
      () =>
        h(
          'div',
          null,
          h(Switch as any, {
            fallback: 'none',
            children: [
              h(Match as any, { when: () => route() === 'a', children: 'A' }),
              h(Match as any, { when: () => route() === 'b', children: 'B' }),
            ],
          })
        ),
      c
    );
    expect(c.textContent).toBe('A');
    setRoute('b');
    expect(c.textContent).toBe('B');
    setRoute('z');
    expect(c.textContent).toBe('none');
  });

  it('Show disposes effects of the hidden branch', () => {
    const c = mount();
    const [show, setShow] = createSignal(true);
    const [tick, setTick] = createSignal(0);
    let runs = 0;
    const Inner = () => {
      createEffect(() => {
        tick();
        runs++;
      });
      return h('span', null, 'in');
    };
    render(() => h('div', null, h(Show as any, { when: () => show(), children: () => h(Inner as any, {}) })), c);
    setShow(false);
    const before = runs;
    setTick(1);
    expect(runs).toBe(before);
    expect(c.textContent).toBe('');
  });

  it('For keeps row nodes when items are added, removed or moved', () => {
    const c = mount();
    const a = { id: 'a' };
    const b = { id: 'b' };
    const d = { id: 'd' };
    const [items, setItems] = createSignal([a, b]);
    render(
      () =>
        h(
          'ul',
          null,
          h(For as any, {
            each: () => items(),
            children: (x: { id: string }, i: () => number) => h('li', null, x.id, () => i()),
          })
        ),
      c
    );
    const [liA, liB] = Array.from(c.querySelectorAll('li'));
    setItems([b, a, d]);
    const lis = Array.from(c.querySelectorAll('li'));
    expect(lis[0]).toBe(liB);
    expect(lis[1]).toBe(liA);
    expect(lis.map((l) => l.textContent)).toEqual(['b0', 'a1', 'd2']);
    setItems([d]);
    expect(c.querySelectorAll('li').length).toBe(1);
  });

  it('For disposes effects of removed rows', () => {
    const c = mount();
    const [items, setItems] = createSignal([1, 2]);
    const [tick, setTick] = createSignal(0);
    let runs = 0;
    render(
      () =>
        h(
          'ul',
          null,
          h(For as any, {
            each: () => items(),
            children: (n: number) => {
              createEffect(() => {
                tick();
                runs++;
              });
              return h('li', null, String(n));
            },
          })
        ),
      c
    );
    setItems([1]);
    runs = 0;
    setTick(1);
    expect(runs).toBe(1);
  });

  it('ErrorBoundary catches render and effect errors, keeps siblings, and resets', () => {
    const c = mount();
    const [boom, setBoom] = createSignal(false);
    let reset!: () => void;
    const Risky = () => {
      createEffect(() => {
        if (boom()) throw new Error('later');
      });
      return h('span', null, 'ok');
    };
    render(
      () =>
        h(
          'div',
          null,
          h('i', null, 'sibling'),
          h(ErrorBoundary as any, {
            fallback: (e: Error, r: () => void) => {
              reset = r;
              return h('b', null, e.message);
            },
            children: () => h(Risky as any, {}),
          })
        ),
      c
    );
    expect(c.textContent).toBe('siblingok');
    setBoom(true);
    expect(c.textContent).toBe('siblinglater');
    setBoom(false);
    reset();
    expect(c.textContent).toBe('siblingok');
  });

  it('context reaches function children of a Provider', () => {
    const c = mount();
    const Ctx = createContext('default');
    const Child = () => h('span', null, useContext(Ctx));
    render(() => h(Ctx.Provider as any, { value: 'dark', children: () => h(Child as any, {}) }), c);
    expect(c.textContent).toBe('dark');
  });
});

describe('hydration', () => {
  it('reuses server elements, keeps static text and wires reactivity', () => {
    const c = mount();
    // What @velozjs/ssr emits for the tree below (children get keys first).
    c.innerHTML = '<p data-hk="1">Count: <!--[-->2<!--]--><button data-hk="0">+</button></p>';
    const serverP = c.querySelector('p');
    const serverButton = c.querySelector('button');
    const [n, setN] = createSignal(2);
    hydrate(() => h('p', null, 'Count: ', () => n(), h('button', { onClick: () => setN(n() + 1) }, '+')), c);
    expect(c.querySelector('p')).toBe(serverP);
    expect(c.querySelector('button')).toBe(serverButton);
    serverButton!.click();
    expect(c.querySelector('p')!.textContent).toBe('Count: 3+');
  });

  it('only looks inside its own container', () => {
    const other = mount();
    other.innerHTML = '<span data-hk="0">other</span>';
    const c = mount();
    c.innerHTML = '<span data-hk="0">mine</span>';
    const mine = c.querySelector('span');
    hydrate(() => h('span', null, 'mine'), c);
    expect(c.querySelector('span')).toBe(mine);
    expect(other.textContent).toBe('other');
  });
});

describe('URL safety', () => {
  const bad = [
    'javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'vbscript:x',
    'data:text/html,<script>',
  ];
  for (const u of bad) {
    it('blocks ' + JSON.stringify(u), () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(sanitizeURL(u)).toBe('about:blank');
      expect(validateAttribute('href', u)).toBe(false);
      expect(sanitize(`<a href="${u.replace(/"/g, '')}">x</a>`).toLowerCase()).not.toMatch(/script:|data:text/);
      spy.mockRestore();
    });
  }

  it('allows raster data images in src but not svg', () => {
    expect(validateAttribute('src', 'data:image/png;base64,AAAA')).toBe(true);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateAttribute('href', 'data:image/png;base64,AAAA')).toBe(false);
    expect(validateAttribute('src', 'data:image/svg+xml,<svg onload=alert(1)>')).toBe(false);
    spy.mockRestore();
  });

  it('a rejected reactive URL removes the old value', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const c = mount();
    const [url, setUrl] = createSignal('/ok');
    render(() => h('a', { href: () => url() }, 'x'), c);
    setUrl('javascript:alert(1)');
    expect(c.querySelector('a')!.hasAttribute('href')).toBe(false);
    spy.mockRestore();
  });

  it('rejects attribute names that could inject markup', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateAttribute('x onmouseover', '1')).toBe(false);
    spy.mockRestore();
  });
});
