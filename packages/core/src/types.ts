export interface Owner {
  parent: Owner | null;
  children: Owner[];
  cleanups: (() => void)[];
  context: { [key: symbol]: unknown };
}

export interface Computation extends Owner {
  fn: ((prev?: unknown) => unknown) | null;
  sources: SignalNode<unknown>[];
  sourceSlots: number[];
  state: ComputationState;
  updatedAt: number;
}

export interface SignalNode<T> {
  value: T;
  observers: Computation[];
  observerSlots: number[];
  equals: false | ((a: T, b: T) => boolean);
}

export const enum ComputationState {
  Clean = 0,
  Dirty = 1,
  Pending = 2,
}

export type Getter<T> = () => T;
export type Setter<T> = (value: T | ((prev: T) => T)) => T;
export type Signal<T> = [get: Getter<T>, set: Setter<T>];

export interface Context<T> {
  id: symbol;
  defaultValue: T | undefined;
  Provider: (props: { value: T; children?: unknown }) => unknown;
}

export type Disposer = () => void;
