import { createOwner, setCurrentOwner, disposeOwner, onCleanup } from '@veloz/core';
import { insertChild } from '../jsx-runtime.js';
import type { VelozNode } from '../types.js';

export interface PortalProps {
  mount?: HTMLElement;
  children?: VelozNode;
}

export function Portal(props: PortalProps): Node {
  const mount = props.mount ?? document.body;
  const container = document.createElement('div');

  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);

  try {
    insertChild(container, props.children);
    mount.appendChild(container);
  } finally {
    setCurrentOwner(prevOwner);
  }

  onCleanup(() => {
    disposeOwner(owner);
    container.remove();
  });

  return document.createComment('Portal');
}
