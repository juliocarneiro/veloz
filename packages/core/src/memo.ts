import type { Computation, SignalNode, Getter, SignalOptions } from './types.js';
import { ComputationState } from './types.js';
import { createComputationNode, runComputation, trackRead, updateIfNecessary } from './reactive.js';

/**
 * Derived, cached value. Recomputes only when its sources change, and only
 * notifies dependents when the result is different (per `equals`).
 */
export function createMemo<T>(
  fn: (prev: T | undefined) => T,
  initialValue?: T,
  options?: SignalOptions<T>
): Getter<T> {
  const comp = createComputationNode(fn, initialValue);
  const node: SignalNode<T> = {
    value: initialValue as T,
    observers: new Set(),
    equals: options?.equals ?? Object.is,
    comp,
  };
  comp.node = node;

  // First run: compute the value without notifying anyone.
  const equals = node.equals;
  node.equals = false;
  runComputation(comp as Computation);
  node.equals = equals;

  return () => {
    if (comp.state !== ComputationState.Clean) updateIfNecessary(comp as Computation);
    trackRead(node);
    return node.value;
  };
}
