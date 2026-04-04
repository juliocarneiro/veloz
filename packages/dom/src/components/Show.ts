import { createEffect } from '@veloz/core';
import { isHydrating } from '../hydration-state.js';
import type { VelozNode } from '../types.js';

export interface ShowProps<T> {
  when: T | undefined | null | false | (() => T | undefined | null | false);
  fallback?: VelozNode;
  children: unknown;
}

export function Show<T>(props: ShowProps<T>): Node {
  if (isHydrating()) {
    return hydrateShow(props);
  }

  const startMarker = document.createComment('Show');
  const endMarker = document.createComment('/Show');
  const frag = document.createDocumentFragment();
  frag.appendChild(startMarker);
  frag.appendChild(endMarker);

  let currentNodes: Node[] = [];
  let initialized = false;

  createEffect(() => {
    const raw = props.when;
    const condition = typeof raw === 'function' ? (raw as () => unknown)() : raw;
    const parent = startMarker.parentNode;

    if (parent) {
      for (const node of currentNodes) {
        parent.removeChild(node);
      }
    }
    currentNodes = [];

    let content: unknown;
    if (condition) {
      if (typeof props.children === 'function') {
        content = (props.children as (value: T) => VelozNode)(condition as T);
      } else {
        content = props.children;
      }
    } else if (props.fallback != null) {
      content = props.fallback;
    }

    if (content != null) {
      const nodes = toNodes(content);
      currentNodes = nodes;

      if (parent) {
        for (const node of nodes) {
          parent.insertBefore(node, endMarker);
        }
      } else if (!initialized) {
        for (const node of nodes) {
          frag.insertBefore(node, endMarker);
        }
      }
    }

    initialized = true;
  });

  return frag;
}

function hydrateShow<T>(props: ShowProps<T>): Node {
  const raw = props.when;
  const condition = typeof raw === 'function' ? (raw as () => unknown)() : raw;

  if (condition) {
    if (typeof props.children === 'function') {
      (props.children as (value: T) => unknown)(condition as T);
    }
  }

  return document.createTextNode('');
}

function toNodes(content: unknown): Node[] {
  if (content instanceof DocumentFragment) {
    return Array.from(content.childNodes);
  }
  if (content instanceof Node) return [content];
  if (Array.isArray(content)) {
    const nodes: Node[] = [];
    for (const item of content) nodes.push(...toNodes(item));
    return nodes;
  }
  if (content == null || typeof content === 'boolean') return [];
  return [document.createTextNode(String(content))];
}
