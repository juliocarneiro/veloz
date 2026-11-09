import { describe, it, expect, vi } from 'vitest';
import {
  createSignal, createEffect, createMemo, createOwner, setCurrentOwner, disposeOwner,
  batch, createRoot, onCleanup, onMount, on,
} from '../src/index.js';

describe('ownership', () => {
  it('effects stop after their owner is disposed', () => {
    const [s, set] = createSignal(0);
    const owner = createOwner();
    const prev = setCurrentOwner(owner);
    let runs = 0;
    createEffect(() => { s(); runs++; });
    setCurrentOwner(prev);
    disposeOwner(owner);
    set(1);
    expect(runs).toBe(1);
  });

  it('nested effects are disposed when the parent re-runs', () => {
    const [outer, setOuter] = createSignal(0);
    const [inner, setInner] = createSignal(0);
    let innerRuns = 0;
    createEffect(() => {
      outer();
      createEffect(() => { inner(); innerRuns++; });
    });
    setOuter(1); // old inner effect disposed, new one created
    innerRuns = 0;
    setInner(1);
    expect(innerRuns).toBe(1);
  });

  it('createRoot is not disposed with its parent and returns dispose', () => {
    const [s, set] = createSignal(0);
    let runs = 0;
    const dispose = createRoot((d) => { createEffect(() => { s(); runs++; }); return d; });
    set(1);
    expect(runs).toBe(2);
    dispose();
    set(2);
    expect(runs).toBe(2);
  });
});

describe('glitch-free updates', () => {
  it('diamond: effect runs once with consistent values', () => {
    const [a, setA] = createSignal(1);
    const b = createMemo(() => a() * 2);
    const c = createMemo(() => a() + 1);
    const seen: string[] = [];
    createEffect(() => { seen.push(`${a()}-${b()}-${c()}`); });
    seen.length = 0;
    setA(2);
    expect(seen).toEqual(['2-4-3']);
  });

  it('memo that does not change does not re-run dependents', () => {
    const [a, setA] = createSignal(1);
    const parity = createMemo(() => a() % 2);
    let runs = 0;
    createEffect(() => { parity(); runs++; });
    setA(3);
    expect(runs).toBe(1);
    setA(4);
    expect(runs).toBe(2);
  });

  it('repeated reads subscribe once', () => {
    const [a, setA] = createSignal(0);
    let runs = 0;
    createEffect(() => { a(); a(); a(); runs++; });
    setA(1);
    expect(runs).toBe(2);
  });
});

describe('errors and loops', () => {
  it('an effect error does not drop other queued effects', () => {
    const [a, setA] = createSignal(0);
    let other = 0;
    createEffect(() => { if (a() === 1) throw new Error('boom'); });
    createEffect(() => { a(); other++; });
    expect(() => setA(1)).toThrow('boom');
    expect(other).toBe(2);
  });

  it('detects effects that re-trigger forever', () => {
    const [a, setA] = createSignal(0);
    expect(() => createEffect(() => { setA(a() + 1); })).toThrow(/infinite loop/);
  });
});

describe('lifecycle', () => {
  it('onMount runs inside the owner so onCleanup works', async () => {
    const cleanup = vi.fn();
    const owner = createOwner();
    const prev = setCurrentOwner(owner);
    onMount(() => onCleanup(cleanup));
    setCurrentOwner(prev);
    await Promise.resolve();
    disposeOwner(owner);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('onMount is skipped if disposed first', async () => {
    const fn = vi.fn();
    const owner = createOwner();
    const prev = setCurrentOwner(owner);
    onMount(fn);
    setCurrentOwner(prev);
    disposeOwner(owner);
    await Promise.resolve();
    expect(fn).not.toHaveBeenCalled();
  });

  it('on() with array deps passes typed values', () => {
    const [a, setA] = createSignal(1);
    const [b] = createSignal('x');
    const calls: unknown[] = [];
    createEffect(on([a, b], ([x, y]) => { calls.push(`${x}${y}`); }));
    batch(() => setA(2));
    expect(calls).toEqual(['1x', '2x']);
  });
});
