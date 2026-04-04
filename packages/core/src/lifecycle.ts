import { getCurrentOwner } from './reactive.js';
import { createEffect } from './effect.js';

export function onCleanup(fn: () => void): void {
  const owner = getCurrentOwner();
  if (owner) {
    owner.cleanups.push(fn);
  }
}

export function onMount(fn: () => void): void {
  createEffect(() => {
    queueMicrotask(fn);
  });
}
