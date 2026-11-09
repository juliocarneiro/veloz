import { createOwner, setCurrentOwner, disposeOwner, untrack, type Disposer } from '@velozjs/core';
import { insertChild } from './insert.js';
import { setupDelegation } from './events.js';

/** Renders `code()` into `container`, replacing its content. Returns a disposer. */
export function render(code: () => unknown, container: Element | DocumentFragment): Disposer {
  setupDelegation(container);
  const root = createOwner();
  const prevOwner = setCurrentOwner(root);
  try {
    container.textContent = '';
    insertChild(container, untrack(code));
  } finally {
    setCurrentOwner(prevOwner);
  }

  return () => {
    disposeOwner(root);
    container.textContent = '';
  };
}
