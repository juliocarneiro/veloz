export interface Owner {
  parent: Owner | null;
  children: Owner[];
  cleanups: (() => void)[];
  context: { [key: symbol]: unknown };
  disposed: boolean;
}

/**
 * Computation states, ordered by "dirtiness":
 * - Clean: up to date
 * - Pending: an upstream memo may have changed; check sources before running
 * - Dirty: a direct source changed; must re-run
 */
export const ComputationState = {
  Clean: 0,
  Pending: 1,
  Dirty: 2,
} as const;
export type ComputationState = (typeof ComputationState)[keyof typeof ComputationState];

export interface Computation<T = unknown> extends Owner {
  fn: ((prev: T | undefined) => T) | null;
  /** Last value returned by fn (passed back as `prev`). */
  value: T | undefined;
  sources: Set<SignalNode<unknown>>;
  state: ComputationState;
  /** Set for memos: the node other computations subscribe to. */
  node: SignalNode<T> | null;
}

export interface SignalNode<T> {
  value: T;
  observers: Set<Computation>;
  equals: false | ((a: T, b: T) => boolean);
  /** Set when this node is the output of a memo. */
  comp: Computation<T> | null;
}

export type Getter<T> = () => T;
export type Setter<T> = <U extends T>(value: U | ((prev: T) => U)) => U;
export type Signal<T> = [get: Getter<T>, set: Setter<T>];

export interface Context<T> {
  id: symbol;
  defaultValue: T | undefined;
  Provider: (props: { value: T; children?: unknown }) => unknown;
}

export type Disposer = () => void;

export interface SignalOptions<T> {
  /** Custom equality check, or `false` to always notify. Defaults to `Object.is`. */
  equals?: false | ((a: T, b: T) => boolean);
}
