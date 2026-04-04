import { createSignal, createOwner, setCurrentOwner } from '@veloz/core';
import { insertChild } from '../jsx-runtime.js';
import type { VelozNode } from '../types.js';

export interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => VelozNode;
  children?: VelozNode;
}

export function ErrorBoundary(props: ErrorBoundaryProps): Node {
  const [error, setError] = createSignal<Error | null>(null);
  const container = document.createDocumentFragment();
  const marker = document.createComment('ErrorBoundary');
  container.appendChild(marker);

  const reset = () => {
    setError(null);
    tryRenderChildren();
  };

  function tryRenderChildren(): void {
    const parent = marker.parentNode;
    if (!parent) {
      try {
        const result = renderChildren();
        container.appendChild(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        const fallbackResult = props.fallback(error()!, reset);
        if (fallbackResult instanceof Node) {
          container.appendChild(fallbackResult);
        }
      }
      return;
    }

    clearSiblings(marker);
    try {
      const result = renderChildren();
      if (result instanceof Node) {
        parent.insertBefore(result, marker);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      const fallbackResult = props.fallback(error()!, reset);
      if (fallbackResult instanceof Node) {
        parent.insertBefore(fallbackResult, marker);
      }
    }
  }

  function renderChildren(): Node {
    const frag = document.createDocumentFragment();
    insertChild(frag, props.children);
    return frag;
  }

  tryRenderChildren();

  return container.childNodes.length === 1 ? container.childNodes[0] : marker;
}

function clearSiblings(marker: Node): void {
  const parent = marker.parentNode;
  if (!parent) return;
  while (parent.firstChild && parent.firstChild !== marker) {
    parent.removeChild(parent.firstChild);
  }
}
