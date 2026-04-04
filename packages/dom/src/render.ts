import {
  createOwner,
  setCurrentOwner,
  disposeOwner,
  type Disposer,
} from '@veloz/core';
import { setupDelegation } from './events.js';
import { insertChild } from './jsx-runtime.js';

export function render(
  code: () => unknown,
  container: HTMLElement
): Disposer {
  setupDelegation(container);

  const root = createOwner();
  const prevOwner = setCurrentOwner(root);

  try {
    const result = code();
    container.textContent = '';
    insertChild(container, result);
  } finally {
    setCurrentOwner(prevOwner);
  }

  return () => {
    disposeOwner(root);
    container.textContent = '';
  };
}
