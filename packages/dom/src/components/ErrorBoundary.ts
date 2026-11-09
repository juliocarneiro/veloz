import { createSignal, catchError, untrack } from '@velozjs/core';
import { toNodes } from '../jsx-runtime.js';
import type { StaticElement, VelozNode } from '../types.js';

export interface ErrorBoundaryProps {
  fallback: StaticElement | ((error: Error, reset: () => void) => VelozNode);
  /**
   * Pass a function (`{() => <App />}`) so rendering happens inside the
   * boundary; JSX children written directly are created before it runs.
   */
  children?: unknown;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Catches errors thrown while rendering its children and in any effect they
 * create later, and shows `fallback`. `reset()` renders the children again.
 */
export function ErrorBoundary(props: ErrorBoundaryProps): () => unknown {
  const [failure, setFailure] = createSignal<{ error: Error } | null>(null);
  const reset = () => setFailure(null);

  return () => {
    const f = failure();
    if (f) {
      const fallback = props.fallback;
      return typeof fallback === 'function' ? untrack(() => fallback(f.error, reset)) : fallback;
    }
    // Resolve the children to nodes inside the boundary, so the effects they
    // create are owned by it and their errors land here.
    return catchError(
      () => {
        const children = props.children;
        return toNodes(typeof children === 'function' ? (children as () => unknown)() : children);
      },
      (err) => setFailure({ error: toError(err) })
    );
  };
}
