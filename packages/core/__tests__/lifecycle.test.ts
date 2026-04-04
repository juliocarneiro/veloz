import { describe, it, expect, vi } from 'vitest';
import { createSignal } from '../src/signal.js';
import { createEffect } from '../src/effect.js';
import { onCleanup, onMount } from '../src/lifecycle.js';
import { disposeOwner, createOwner, setCurrentOwner } from '../src/reactive.js';

describe('onCleanup', () => {
  it('should run cleanup when effect re-runs', () => {
    const [count, setCount] = createSignal(0);
    const cleanup = vi.fn();

    createEffect(() => {
      count();
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();
    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should run cleanup when owner is disposed', () => {
    const cleanup = vi.fn();

    const root = createOwner();
    const prev = setCurrentOwner(root);

    createEffect(() => {
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();
    disposeOwner(root);
    expect(cleanup).toHaveBeenCalledTimes(1);

    setCurrentOwner(prev);
  });

  it('should support multiple cleanups', () => {
    const [count, setCount] = createSignal(0);
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    createEffect(() => {
      count();
      onCleanup(cleanup1);
      onCleanup(cleanup2);
    });

    setCount(1);
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });
});

describe('onMount', () => {
  it('should run callback asynchronously', async () => {
    const mountFn = vi.fn();

    onMount(mountFn);

    expect(mountFn).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 10));
    expect(mountFn).toHaveBeenCalledTimes(1);
  });
});
