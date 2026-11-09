import {
  createOwner,
  setCurrentOwner,
  disposeOwner,
  untrack,
  setResourceData,
  type Disposer,
  type ResourceEntry,
} from '@velozjs/core';
import { startHydration, endHydration } from './hydration-state.js';
import { hydrateChild } from './insert.js';
import { setupDelegation } from './events.js';

/**
 * Attaches to HTML rendered by `@velozjs/ssr` inside `container`: reuses the
 * server elements, wires events and effects, and only creates what is missing.
 */
export function hydrate(code: () => unknown, container: Element): Disposer {
  setupDelegation(container);
  const root = createOwner();
  const prevOwner = setCurrentOwner(root);
  startHydration(container);
  // Values the server already loaded (from renderToStringAsync's script).
  const g = globalThis as { __veloz_data?: Record<string, ResourceEntry> };
  setResourceData(g.__veloz_data ?? null);
  delete g.__veloz_data;
  try {
    hydrateChild(container, untrack(code));
  } finally {
    setResourceData(null);
    endHydration();
    setCurrentOwner(prevOwner);
  }

  return () => {
    disposeOwner(root);
    container.textContent = '';
  };
}
