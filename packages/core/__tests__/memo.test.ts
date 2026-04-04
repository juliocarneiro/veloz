import { describe, it, expect, vi } from 'vitest';
import { createSignal } from '../src/signal.js';
import { createEffect } from '../src/effect.js';
import { createMemo } from '../src/memo.js';

describe('createMemo', () => {
  it('should compute derived value', () => {
    const [count] = createSignal(5);
    const doubled = createMemo(() => count() * 2);
    expect(doubled()).toBe(10);
  });

  it('should update when dependencies change', () => {
    const [count, setCount] = createSignal(5);
    const doubled = createMemo(() => count() * 2);

    expect(doubled()).toBe(10);
    setCount(10);
    expect(doubled()).toBe(20);
  });

  it('should cache computed value', () => {
    const [count] = createSignal(5);
    const computeFn = vi.fn(() => count() * 2);
    const doubled = createMemo(computeFn);

    doubled();
    doubled();
    doubled();

    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  it('should not notify downstream if computed value unchanged', () => {
    const [count, setCount] = createSignal(5);
    const isPositive = createMemo(() => count() > 0);
    let effectCount = 0;

    createEffect(() => {
      isPositive();
      effectCount++;
    });

    expect(effectCount).toBe(1);

    setCount(10);
    expect(isPositive()).toBe(true);
  });

  it('should handle chained memos', () => {
    const [a, setA] = createSignal(1);
    const b = createMemo(() => a() * 2);
    const c = createMemo(() => b() + 1);

    expect(c()).toBe(3);
    setA(5);
    expect(b()).toBe(10);
    expect(c()).toBe(11);
  });

  it('should support custom equality', () => {
    const [items, setItems] = createSignal([1, 2, 3]);
    const length = createMemo(() => items().length, undefined, {
      equals: (a, b) => a === b,
    });

    expect(length()).toBe(3);
    setItems([4, 5, 6]);
    expect(length()).toBe(3);
  });
});
