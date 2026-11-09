import { createOwner, setCurrentOwner, disposeOwner, onCleanup } from '@velozjs/core';
import { insertChild } from '../insert.js';
import { withoutHydration } from '../hydration-state.js';

export interface PortalProps {
  /** Where to render. Defaults to `document.body`. */
  mount?: Element;
  /** Pass a function to create the content inside the portal's scope. */
  children?: unknown;
}

/**
 * Renders children into another element (modals, toasts). Events still reach
 * the handlers, and everything is removed when the Portal is disposed.
 * Not rendered during SSR; created on the client after hydration.
 */
export function Portal(props: PortalProps): null {
  const mount = props.mount ?? document.body;
  const container = document.createElement('div');
  container.setAttribute('data-veloz-portal', '');

  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);
  try {
    withoutHydration(() => {
      const children = props.children;
      insertChild(container, typeof children === 'function' ? children : children);
    });
    mount.appendChild(container);
  } finally {
    setCurrentOwner(prevOwner);
  }

  onCleanup(() => {
    disposeOwner(owner);
    container.remove();
  });

  return null;
}
