import { createSignal, createEffect } from '@veloz/core';
import { insertChild } from '../jsx-runtime.js';
import type { VelozNode } from '../types.js';

export interface SuspenseProps {
  fallback?: VelozNode;
  children?: VelozNode;
}

export function Suspense(props: SuspenseProps): Node {
  const container = document.createDocumentFragment();
  const frag = document.createDocumentFragment();
  insertChild(frag, props.children);

  for (const node of Array.from(frag.childNodes)) {
    container.appendChild(node);
  }

  return container.childNodes.length === 1
    ? container.childNodes[0]
    : document.createComment('Suspense');
}
