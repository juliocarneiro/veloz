import { describe, it, expect, vi } from 'vitest';
import { createSignal, createContext, useContext } from '@velozjs/core';
import * as client from '../src/index';
import * as server from '../../ssr/src/index';

/**
 * End to end: the same component code rendered by @velozjs/ssr, then hydrated
 * by @velozjs/dom. Server elements must be reused and stay interactive.
 */
type Runtime = typeof client | typeof server;

function makeH(rt: Runtime) {
  return (tag: any, props: Record<string, unknown> | null, ...children: unknown[]) =>
    (rt.jsx as any)(tag, {
      ...(props ?? {}),
      ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}),
    });
}

const Theme = createContext('light');

function App(rt: Runtime, onClick: () => void) {
  const h = makeH(rt);
  const [n, setN] = createSignal(2);
  const Label = () => h('em', null, useContext(Theme));
  return h(
    'main',
    null,
    h('p', null, 'Count: ', () => n(), ' items'),
    h(rt.Show, { when: () => n() > 2, fallback: h('i', null, 'small'), children: () => h('b', null, 'big') }),
    h('ul', null, h(rt.For, { each: ['x', 'y'], children: (x: string, i: () => number) => h('li', null, x, () => i()) })),
    h(rt.Switch, {
      fallback: 'none',
      children: [h(rt.Match, { when: () => n() % 2 === 0, children: 'even' }), h(rt.Match, { when: () => n() % 2 === 1, children: 'odd' })],
    }),
    h((Theme as any).Provider, { value: 'dark', children: () => h(Label, {}) }),
    h('button', { onClick: () => { onClick(); setN(n() + 1); } }, '+')
  );
}

describe('SSR → hydrate', () => {
  it('reuses every server element and stays reactive', () => {
    const { html } = server.renderToString(() => App(server, () => {}));
    expect(html).not.toContain('data-hk="undefined"');

    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = html;
    const before = {
      main: container.querySelector('main'),
      p: container.querySelector('p'),
      lis: Array.from(container.querySelectorAll('li')),
      button: container.querySelector('button'),
    };
    expect(container.textContent).toBe('Count: 2 itemssmallx0y1evendark+');

    const clicked = vi.fn();
    client.hydrate(() => App(client, clicked), container);

    // Same nodes, same text, nothing duplicated.
    expect(container.querySelector('main')).toBe(before.main);
    expect(container.querySelector('p')).toBe(before.p);
    expect(Array.from(container.querySelectorAll('li'))).toEqual(before.lis);
    expect(container.querySelector('button')).toBe(before.button);
    expect(container.textContent).toBe('Count: 2 itemssmallx0y1evendark+');
    expect(container.querySelectorAll('[data-hk]').length).toBe(0);

    before.button!.click();
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('Count: 3 itemsbigx0y1odddark+');
  });
});
