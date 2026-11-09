import { getCurrentOwner, runWithOwner } from './reactive.js';
import { untrack } from './signal.js';

/** Registers `fn` to run when the current owner re-runs or is disposed. */
export function onCleanup(fn: () => void): void {
  const owner = getCurrentOwner();
  if (owner) {
    owner.cleanups.push(fn);
  } else if (isDev()) {
    console.warn('[Veloz] onCleanup was called outside a component or effect; it will never run.');
  }
}

/**
 * Runs `fn` once, after the current render has been attached (next microtask).
 * It runs untracked, inside the component's owner, so `onCleanup` works in it.
 * Skipped if the component was disposed before mounting.
 */
export function onMount(fn: () => void): void {
  const owner = getCurrentOwner();
  queueMicrotask(() => {
    if (owner?.disposed) return;
    runWithOwner(owner, () => untrack(fn));
  });
}

function isDev(): boolean {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.NODE_ENV !== 'production';
}
