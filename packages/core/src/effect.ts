import type { Computation } from './types.js';
import { createComputationNode, runComputation } from './reactive.js';

/**
 * Runs `fn` now and again whenever a signal it read changes. The previous
 * return value is passed back as `prev`. Disposed with its owner.
 */
export function createEffect<T>(fn: (prev: T | undefined) => T, initialValue?: T): void {
  const comp = createComputationNode(fn, initialValue);
  runComputation(comp as Computation);
}

/**
 * Same scheduling as `createEffect`; used by the renderer for DOM updates.
 */
export function createRenderEffect<T>(fn: (prev: T | undefined) => T, initialValue?: T): void {
  const comp = createComputationNode(fn, initialValue);
  runComputation(comp as Computation);
}

/** Creates a computation without running it (low-level). */
export function createComputation(fn: () => void): Computation {
  return createComputationNode(fn as (prev: unknown) => unknown) as Computation;
}
