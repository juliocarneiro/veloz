import { describe, it, expect, vi } from 'vitest';
import { createSignal } from '../src/signal.js';
import { createEffect } from '../src/effect.js';
import { onCleanup } from '../src/lifecycle.js';

describe('createEffect', () => {
  it('should run immediately', () => {
    let ran = false;
    createEffect(() => {
      ran = true;
    });
    expect(ran).toBe(true);
  });

  it('should re-run when dependencies change', () => {
    const [count, setCount] = createSignal(0);
    let observed = 0;

    createEffect(() => {
      observed = count();
    });

    expect(observed).toBe(0);
    setCount(5);
    expect(observed).toBe(5);
  });

  it('should track dynamic dependencies', () => {
    const [cond, setCond] = createSignal(true);
    const [a, setA] = createSignal('a');
    const [b, setB] = createSignal('b');
    let observed = '';

    createEffect(() => {
      observed = cond() ? a() : b();
    });

    expect(observed).toBe('a');

    setCond(false);
    expect(observed).toBe('b');

    setA('aa');
    expect(observed).toBe('b');

    setB('bb');
    expect(observed).toBe('bb');
  });

  it('should run cleanup before re-execution', () => {
    const [count, setCount] = createSignal(0);
    const cleanupFn = vi.fn();

    createEffect(() => {
      count();
      onCleanup(cleanupFn);
    });

    expect(cleanupFn).not.toHaveBeenCalled();

    setCount(1);
    expect(cleanupFn).toHaveBeenCalledTimes(1);

    setCount(2);
    expect(cleanupFn).toHaveBeenCalledTimes(2);
  });

  it('should handle nested effects', () => {
    const [outer, setOuter] = createSignal(0);
    const [inner, setInner] = createSignal(0);
    let outerRuns = 0;
    let innerRuns = 0;

    createEffect(() => {
      outer();
      outerRuns++;
      createEffect(() => {
        inner();
        innerRuns++;
      });
    });

    expect(outerRuns).toBe(1);
    expect(innerRuns).toBe(1);

    setInner(1);
    expect(outerRuns).toBe(1);
    expect(innerRuns).toBe(2);
  });
});
