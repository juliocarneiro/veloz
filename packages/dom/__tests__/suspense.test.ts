import { describe, it, expect } from 'vitest';
import { createResource, createSignal } from '@velozjs/core';
import * as client from '../src/index';
import * as server from '../../ssr/src/index';
import { render } from '../src/render';
import { createElement as h } from '../src/jsx-runtime';
import { Suspense } from '../src/components/Suspense';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const tick = () => new Promise((r) => setTimeout(r, 0));
const mount = () => {
  const c = document.createElement('div');
  document.body.appendChild(c);
  return c;
};

describe('Suspense (client)', () => {
  it('shows the fallback until the data arrives', async () => {
    const c = mount();
    let resolve!: (v: string) => void;
    const Profile = () => {
      const [user] = createResource(() => new Promise<string>((r) => (resolve = r)));
      return h('p', null, () => user());
    };
    render(() => h('main', null, h(Suspense as any, { fallback: 'Loading…', children: () => h(Profile as any, {}) })), c);
    expect(c.textContent).toBe('Loading…');
    resolve('Ada');
    await tick();
    expect(c.textContent).toBe('Ada');
  });

  it('waits for every resource inside, and keeps content on refetch', async () => {
    const c = mount();
    const resolvers: ((v: string) => void)[] = [];
    let refetchA!: () => unknown;
    const Part = (p: { name: string }) => {
      const [v, { refetch }] = createResource(() => new Promise<string>((r) => resolvers.push(r)));
      if (p.name === 'a') refetchA = refetch;
      return h('span', null, () => v() ?? '');
    };
    render(
      () =>
        h(Suspense as any, {
          fallback: 'wait',
          children: () => [h(Part as any, { name: 'a' }), h(Part as any, { name: 'b' })],
        }),
      c
    );
    resolvers[0]('A');
    await tick();
    expect(c.textContent).toBe('wait');
    resolvers[1]('B');
    await tick();
    expect(c.textContent).toBe('AB');
    refetchA();
    expect(c.textContent).toBe('AB'); // refreshing: old content stays
    resolvers[2]('A2');
    await tick();
    expect(c.textContent).toBe('A2B');
  });

  it('a failed load is caught by ErrorBoundary', async () => {
    const c = mount();
    const Broken = () => {
      const [v] = createResource(() => Promise.reject(new Error('offline')));
      return h('p', null, () => v());
    };
    render(
      () =>
        h(ErrorBoundary as any, {
          fallback: (e: Error) => `Error: ${e.message}`,
          children: () => h(Suspense as any, { fallback: '…', children: () => h(Broken as any, {}) }),
        }),
      c
    );
    expect(c.textContent).toBe('…');
    await tick();
    expect(c.textContent).toBe('Error: offline');
  });

  it('refetches when the source changes', async () => {
    const c = mount();
    const [id, setId] = createSignal(1);
    const View = () => {
      const [post] = createResource(id, (n) => Promise.resolve(`post ${n}`));
      return h('p', null, () => post() ?? '');
    };
    render(() => h(Suspense as any, { fallback: '…', children: () => h(View as any, {}) }), c);
    await tick();
    expect(c.textContent).toBe('post 1');
    setId(2);
    await tick();
    expect(c.textContent).toBe('post 2');
  });
});

describe('async SSR → hydrate', () => {
  type Runtime = typeof client | typeof server;
  const makeH = (rt: Runtime) => (tag: any, props: Record<string, unknown> | null, ...children: unknown[]) =>
    (rt.jsx as any)(tag, { ...(props ?? {}), ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) });

  function App(rt: Runtime, fetchUser: () => Promise<{ name: string }>) {
    const h = makeH(rt);
    const Profile = () => {
      const [user] = rt.createResource(fetchUser);
      return h('p', null, 'Hello, ', () => user()?.name);
    };
    return h('main', null, h(rt.Suspense, { fallback: h('i', null, 'loading'), children: () => h(Profile, {}) }));
  }

  it('awaits data on the server and hydrates without fetching again', async () => {
    let serverCalls = 0;
    const result = await server.renderToStringAsync(() =>
      App(server, async () => {
        serverCalls++;
        return { name: 'Ada </script>' };
      })
    );
    expect(serverCalls).toBe(1);
    expect(result.html).toContain('Hello, <!--[-->Ada &lt;/script&gt;<!--]-->');
    expect(result.html).not.toContain('loading');
    expect(result.script).toMatch(/^<script>window.__veloz_data=/);
    expect(result.script).not.toContain('</script><');

    // Run the data script the way a browser would.
    const c = mount();
    c.innerHTML = result.html;
    const serverP = c.querySelector('p');
    new Function(result.script.replace(/^<script>|<\/script>$/g, ''))();

    let clientCalls = 0;
    client.hydrate(
      () =>
        App(client, async () => {
          clientCalls++;
          return { name: 'other' };
        }),
      c
    );
    await tick();
    expect(clientCalls).toBe(0);
    expect(c.querySelector('p')).toBe(serverP);
    expect(c.textContent).toBe('Hello, Ada </script>');
    expect((globalThis as { __veloz_data?: unknown }).__veloz_data).toBeUndefined();
  });

  it('sync renderToString renders the fallback for pending data', () => {
    const { html } = server.renderToString(() => App(server, () => new Promise(() => {})));
    expect(html).toContain('loading');
  });
});
