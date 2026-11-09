import { describe, it, expect, vi } from 'vitest';
import { createResource, createSignal, createEffect, createRoot, catchError } from '../src/index.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createResource', () => {
  it('loads async data and exposes its state', async () => {
    const d = deferred<string>();
    const [data] = createResource(() => d.promise);
    expect(data()).toBeUndefined();
    expect(data.state).toBe('pending');
    expect(data.loading).toBe(true);
    d.resolve('hello');
    await tick();
    expect(data()).toBe('hello');
    expect(data.state).toBe('ready');
    expect(data.loading).toBe(false);
  });

  it('is reactive: effects re-run when it resolves', async () => {
    const seen: unknown[] = [];
    const [data] = createResource(() => Promise.resolve(42));
    createEffect(() => {
      seen.push(data());
    });
    await tick();
    expect(seen).toEqual([undefined, 42]);
  });

  it('refetches when the source changes and ignores stale results', async () => {
    const [id, setId] = createSignal(1);
    const calls: Record<number, ReturnType<typeof deferred<string>>> = {};
    const [data] = createResource(id, (n) => {
      calls[n] = deferred<string>();
      return calls[n].promise;
    });
    setId(2);
    calls[2].resolve('two');
    await tick();
    calls[1].resolve('one'); // arrives late: ignored
    await tick();
    expect(data()).toBe('two');
  });

  it('does not fetch while the source is falsy', () => {
    const fetcher = vi.fn(() => Promise.resolve(1));
    const [ready, setReady] = createSignal(false);
    createResource(ready, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    setReady(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('throws on read after a failure, so error boundaries catch it', async () => {
    const [data] = createResource(() => Promise.reject(new Error('nope')));
    await tick();
    expect(data.state).toBe('errored');
    expect(() => data()).toThrow('nope');
    const handler = vi.fn();
    catchError(() => createEffect(() => data()), handler);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ message: 'nope' }));
  });

  it('mutate and refetch', async () => {
    let n = 0;
    const [data, { mutate, refetch }] = createResource(() => Promise.resolve(++n));
    await tick();
    expect(data()).toBe(1);
    mutate(100);
    expect(data()).toBe(100);
    refetch();
    expect(data.state).toBe('refreshing');
    expect(data()).toBe(100); // keeps the old value while refreshing
    await tick();
    expect(data()).toBe(2);
  });

  it('accepts synchronous fetchers', () => {
    const [data] = createResource(() => 'now');
    expect(data()).toBe('now');
    expect(data.state).toBe('ready');
  });

  it('ignores results after its owner is disposed', async () => {
    const d = deferred<number>();
    let data!: () => number | undefined;
    const dispose = createRoot((dispose) => {
      [data] = createResource(() => d.promise);
      return dispose;
    });
    dispose();
    d.resolve(1);
    await tick();
    expect(data()).toBeUndefined();
  });
});
