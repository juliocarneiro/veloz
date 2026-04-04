import type { Computation, SignalNode, Getter } from './types.js';
import { ComputationState } from './types.js';
import {
  createOwner,
  setCurrentObserver,
  setCurrentOwner,
  cleanupComputation,
  trackRead,
  notifyObservers,
  incrementClock,
} from './reactive.js';

export function createMemo<T>(
  fn: (prev?: T) => T,
  initialValue?: T,
  options?: { equals?: false | ((a: T, b: T) => boolean) }
): Getter<T> {
  const equals = options?.equals ?? defaultEquals;

  const node: SignalNode<T> = {
    value: initialValue as T,
    observers: [],
    observerSlots: [],
    equals: equals,
  };

  const comp: Computation = {
    ...createOwner(),
    fn: null,
    sources: [],
    sourceSlots: [],
    state: ComputationState.Dirty,
    updatedAt: 0,
  };

  comp.fn = () => {
    const prevObserver = setCurrentObserver(comp);
    const prevOwner = setCurrentOwner(comp);
    cleanupComputation(comp);
    comp.state = ComputationState.Clean;
    comp.updatedAt = incrementClock();

    try {
      const newValue = fn(node.value);
      if (equals === false || !equals(node.value, newValue)) {
        node.value = newValue;
        notifyObservers(node);
      }
    } finally {
      setCurrentObserver(prevObserver);
      setCurrentOwner(prevOwner);
    }
    return undefined;
  };

  // Run initially to establish dependencies
  const prevObserver = setCurrentObserver(comp);
  const prevOwner = setCurrentOwner(comp);
  comp.state = ComputationState.Clean;
  comp.updatedAt = incrementClock();

  try {
    node.value = fn(initialValue);
  } finally {
    setCurrentObserver(prevObserver);
    setCurrentOwner(prevOwner);
  }

  return () => {
    if (comp.state !== ComputationState.Clean) {
      comp.fn!(undefined);
    }
    trackRead(node);
    return node.value;
  };
}

function defaultEquals<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}
