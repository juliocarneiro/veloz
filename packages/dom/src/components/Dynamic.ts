import { createEffect } from '@veloz/core';
import { createElement } from '../jsx-runtime.js';
import type { VelozNode } from '../types.js';

export interface DynamicProps<T extends string | Function> {
  component: T;
  [key: string]: unknown;
}

export function Dynamic<T extends string | Function>(
  props: DynamicProps<T>
): Node {
  const { component, ...rest } = props;
  const marker = document.createComment('Dynamic');
  let currentNode: Node | null = null;

  createEffect(() => {
    const comp = component;
    const parent = marker.parentNode;

    if (currentNode && parent) {
      parent.removeChild(currentNode);
    }

    if (comp) {
      const result = createElement(comp as string | Function, rest as any);
      const node = result instanceof Node
        ? result
        : Array.isArray(result)
          ? (() => { const f = document.createDocumentFragment(); result.forEach(n => f.appendChild(n)); return f; })()
          : document.createTextNode('');

      if (parent) {
        parent.insertBefore(node, marker);
      }
      currentNode = node;
    } else {
      currentNode = null;
    }
  });

  return marker;
}
