import type { SignalNode, Signal, Getter, Setter } from './types.js';
import {
  trackRead,
  notifyObservers,
  startBatch,
  endBatch,
  setCurrentObserver,
} from './reactive.js';

export function createSignal<T>(
  initialValue: T,
  options?: { equals?: false | ((a: T, b: T) => boolean) }
): Signal<T> {
  const node: SignalNode<T> = {
    value: initialValue,
    observers: [],
    observerSlots: [],
    equals: options?.equals ?? defaultEquals,
  };

  const getter: Getter<T> = () => {
    trackRead(node);
    return node.value;
  };

  const setter: Setter<T> = (
    nextValue: T | ((prev: T) => T)
  ): T => {
    const resolved =
      typeof nextValue === 'function'
        ? (nextValue as (prev: T) => T)(node.value)
        : nextValue;

    if (node.equals !== false && node.equals(node.value, resolved)) {
      return node.value;
    }

    node.value = resolved;
    notifyObservers(node);
    return node.value;
  };

  return [getter, setter];
}

function defaultEquals<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

export function batch(fn: () => void): void {
  startBatch();
  try {
    fn();
  } finally {
    endBatch();
  }
}

export function untrack<T>(fn: () => T): T {
  const prev = setCurrentObserver(null);
  try {
    return fn();
  } finally {
    setCurrentObserver(prev);
  }
}

export type OnOptions = { defer?: boolean };

export function on<S, T>(
  deps: Getter<S> | Getter<S>[],
  fn: (value: S | S[], prev: S | S[] | undefined) => T,
  options?: OnOptions
): (prev?: T) => T {
  const isArray = Array.isArray(deps);
  let prevValues: S | S[] | undefined;
  let isFirst = true;

  return () => {
    let currentValues: S | S[];
    if (isArray) {
      currentValues = (deps as Getter<S>[]).map((d) => d());
    } else {
      currentValues = (deps as Getter<S>)();
    }

    if (isFirst && options?.defer) {
      isFirst = false;
      prevValues = isArray
        ? [...(currentValues as S[])]
        : currentValues;
      return undefined as unknown as T;
    }

    const result = untrack(() => fn(currentValues, prevValues));
    prevValues = isArray
      ? [...(currentValues as S[])]
      : currentValues;
    isFirst = false;
    return result;
  };
}
