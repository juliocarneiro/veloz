import type { SignalNode, Signal, Getter, Setter, SignalOptions } from './types.js';
import { trackRead, notifyObservers, startBatch, endBatch, setCurrentObserver } from './reactive.js';

export function createSignal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T>;
export function createSignal<T = undefined>(): Signal<T | undefined>;
export function createSignal<T>(initialValue?: T, options?: SignalOptions<T>): Signal<T> {
  const node: SignalNode<T> = {
    value: initialValue as T,
    observers: new Set(),
    equals: options?.equals ?? Object.is,
    comp: null,
  };

  const getter: Getter<T> = () => {
    trackRead(node);
    return node.value;
  };

  const setter = ((nextValue: T | ((prev: T) => T)): T => {
    const resolved =
      typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(node.value) : nextValue;

    if (node.equals !== false && node.equals(node.value, resolved)) return node.value;

    node.value = resolved;
    notifyObservers(node);
    return node.value;
  }) as Setter<T>;

  return [getter, setter];
}

/** Groups several writes so effects run once, after `fn` returns. */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

/** Reads signals inside `fn` without subscribing the current computation. */
export function untrack<T>(fn: () => T): T {
  const prev = setCurrentObserver(null);
  try {
    return fn();
  } finally {
    setCurrentObserver(prev);
  }
}

export type OnOptions = { defer?: boolean };

type DepValues<D extends readonly Getter<unknown>[]> = { [K in keyof D]: ReturnType<D[K]> };

/**
 * Explicit dependencies: only `deps` are tracked; `fn` runs untracked.
 * With `{ defer: true }`, `fn` is skipped on the first run.
 */
export function on<S, T>(
  deps: Getter<S>,
  fn: (value: S, prev: S | undefined, prevResult: T | undefined) => T,
  options?: OnOptions
): (prevResult: T | undefined) => T | undefined;
export function on<D extends readonly Getter<unknown>[], T>(
  deps: [...D],
  fn: (value: DepValues<D>, prev: DepValues<D> | undefined, prevResult: T | undefined) => T,
  options?: OnOptions
): (prevResult: T | undefined) => T | undefined;
export function on(
  deps: Getter<unknown> | Getter<unknown>[],
  fn: (value: any, prev: any, prevResult: any) => unknown,
  options?: OnOptions
): (prevResult: unknown) => unknown {
  const isArray = Array.isArray(deps);
  let prevValues: unknown;
  let defer = options?.defer ?? false;

  return (prevResult) => {
    const values = isArray ? (deps as Getter<unknown>[]).map((d) => d()) : (deps as Getter<unknown>)();
    if (defer) {
      defer = false;
      prevValues = values;
      return undefined;
    }
    const result = untrack(() => fn(values, prevValues, prevResult));
    prevValues = values;
    return result;
  };
}
