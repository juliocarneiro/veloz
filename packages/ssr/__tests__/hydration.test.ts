import { describe, it, expect } from 'vitest';
import { nextHydrationId, resetHydrationCounter } from '../src/hydration.js';

describe('hydration IDs', () => {
  it('should generate sequential IDs', () => {
    resetHydrationCounter();
    expect(nextHydrationId()).toBe('0');
    expect(nextHydrationId()).toBe('1');
    expect(nextHydrationId()).toBe('2');
  });

  it('should reset counter', () => {
    resetHydrationCounter();
    nextHydrationId();
    nextHydrationId();
    resetHydrationCounter();
    expect(nextHydrationId()).toBe('0');
  });
});
