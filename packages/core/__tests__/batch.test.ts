import { describe, it, expect } from 'vitest';
import { createSignal, batch } from '../src/signal.js';
import { createEffect } from '../src/effect.js';
import { createMemo } from '../src/memo.js';

describe('batch', () => {
  it('should defer effect execution until batch completes', () => {
    const [first, setFirst] = createSignal('John');
    const [last, setLast] = createSignal('Doe');
    const results: string[] = [];

    createEffect(() => {
      results.push(`${first()} ${last()}`);
    });

    expect(results).toEqual(['John Doe']);

    batch(() => {
      setFirst('Jane');
      setLast('Smith');
    });

    expect(results).toEqual(['John Doe', 'Jane Smith']);
  });

  it('should allow reading updated values inside batch', () => {
    const [count, setCount] = createSignal(0);

    batch(() => {
      setCount(1);
      expect(count()).toBe(1);
      setCount(2);
      expect(count()).toBe(2);
    });
  });

  it('should work with memos', () => {
    const [a, setA] = createSignal(1);
    const [b, setB] = createSignal(2);
    const sum = createMemo(() => a() + b());

    batch(() => {
      setA(10);
      setB(20);
    });

    expect(sum()).toBe(30);
  });

  it('should support nested batches', () => {
    const [count, setCount] = createSignal(0);
    let effectCount = 0;

    createEffect(() => {
      count();
      effectCount++;
    });

    expect(effectCount).toBe(1);

    batch(() => {
      setCount(1);
      batch(() => {
        setCount(2);
      });
      setCount(3);
    });

    expect(count()).toBe(3);
  });
});
