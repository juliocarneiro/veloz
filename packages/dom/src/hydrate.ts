import {
  createOwner,
  setCurrentOwner,
  disposeOwner,
  type Disposer,
} from '@veloz/core';
import { setupDelegation } from './events.js';
import { setHydrating, resetHydrationPointer } from './hydration-state.js';

export function hydrate(
  code: () => unknown,
  container: HTMLElement
): Disposer {
  setupDelegation(container);
  resetHydrationPointer();
  setHydrating(true);

  const root = createOwner();
  const prevOwner = setCurrentOwner(root);

  try {
    code();
  } finally {
    setCurrentOwner(prevOwner);
    setHydrating(false);
  }

  return () => {
    disposeOwner(root);
    container.textContent = '';
  };
}
