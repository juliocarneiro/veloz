import { createSignal, provideSuspense } from '@velozjs/core';
import { insertChild, nodesBetween } from '../insert.js';

export interface SuspenseProps {
  /** Shown while a resource read inside is loading for the first time. */
  fallback?: unknown;
  /**
   * Pass a function (`{() => <Profile />}`) so the content is created inside
   * the boundary; JSX children written directly are created before it runs
   * and their resources can't find it.
   */
  children?: unknown;
}

/**
 * Shows `fallback` while any resource read inside is pending, then the
 * content. The content is created once and kept alive while hidden, so its
 * state survives and it can keep loading in the background.
 */
export function Suspense(props: SuspenseProps): () => unknown {
  const [pending, setPending] = createSignal(0);
  provideSuspense({
    increment: () => setPending((n) => n + 1),
    decrement: () => setPending((n) => Math.max(0, n - 1)),
  });

  // The content lives between two markers; while hidden it is parked in a
  // fragment so its regions still have a parent and keep updating.
  const parking = document.createDocumentFragment();
  const start = parking.appendChild(document.createTextNode(''));
  insertChild(parking, props.children);
  const end = parking.appendChild(document.createTextNode(''));

  return () => {
    if (pending() > 0) {
      for (const node of nodesBetween(start, end)) parking.appendChild(node);
      return props.fallback ?? null;
    }
    return nodesBetween(start, end);
  };
}
