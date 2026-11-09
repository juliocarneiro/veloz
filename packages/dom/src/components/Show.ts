import { createMemo, access, type MaybeAccessor } from '@velozjs/core';
import type { VelozNode } from '../types.js';

export interface ShowProps<T> {
  /** Value or accessor; children render while it is truthy. */
  when: MaybeAccessor<T | undefined | null | false>;
  fallback?: unknown;
  /**
   * Nodes, or a function that receives the truthy value. A function renders
   * lazily and its effects are disposed when the condition turns false.
   */
  children?: unknown | ((value: NonNullable<T>) => VelozNode);
}

/** Renders `children` while `when` is truthy, `fallback` otherwise. */
export function Show<T>(props: ShowProps<T>): () => unknown {
  const keyed = typeof props.children === 'function';
  // Re-render only when truthiness flips (or the value, for function children).
  const value = createMemo(() => access(props.when), undefined, {
    equals: (a, b) => (keyed ? a === b : !a === !b),
  });

  return () => {
    const v = value();
    if (!v) return props.fallback ?? null;
    return keyed ? (props.children as (value: NonNullable<T>) => unknown)(v as NonNullable<T>) : props.children;
  };
}
