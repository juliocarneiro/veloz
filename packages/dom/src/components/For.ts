import { createEffect, createSignal } from '@veloz/core';
import { isHydrating } from '../hydration-state.js';
import type { VelozNode } from '../types.js';

export interface ForProps<T> {
  each: T[] | (() => T[]);
  fallback?: VelozNode;
  children: (item: T, index: () => number) => VelozNode;
}

export function For<T>(props: ForProps<T>): Node {
  if (isHydrating()) {
    return hydrateFor(props);
  }

  const startMarker = document.createComment('For');
  const endMarker = document.createComment('/For');
  const frag = document.createDocumentFragment();
  frag.appendChild(startMarker);
  frag.appendChild(endMarker);

  let currentMappings: { item: T; nodes: Node[]; indexSignal: ReturnType<typeof createSignal<number>> }[] = [];
  let initialized = false;

  createEffect(() => {
    const raw = props.each;
    const items = (typeof raw === 'function' ? (raw as () => T[])() : raw) ?? [];
    const parent = startMarker.parentNode;

    if (parent) {
      for (const m of currentMappings) {
        for (const node of m.nodes) {
          parent.removeChild(node);
        }
      }
    }

    if (items.length === 0) {
      currentMappings = [];
      if (props.fallback != null) {
        const nodes = toNodes(props.fallback);
        const dummyIndex = createSignal(0);
        currentMappings = [{ item: undefined as any, nodes, indexSignal: dummyIndex }];
        insertNodes(nodes, parent, endMarker, frag, initialized);
      }
      initialized = true;
      return;
    }

    const newMappings: typeof currentMappings = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const indexSignal = createSignal(i);
      const [getIndex] = indexSignal;
      const content = props.children(item, getIndex);
      const nodes = toNodes(content);
      newMappings.push({ item, nodes, indexSignal });
    }

    for (const mapping of newMappings) {
      insertNodes(mapping.nodes, parent, endMarker, frag, initialized);
    }

    currentMappings = newMappings;
    initialized = true;
  });

  return frag;
}

function hydrateFor<T>(props: ForProps<T>): Node {
  const raw = props.each;
  const items = (typeof raw === 'function' ? (raw as () => T[])() : raw) ?? [];

  for (let i = 0; i < items.length; i++) {
    const indexSignal = createSignal(i);
    const [getIndex] = indexSignal;
    props.children(items[i], getIndex);
  }

  return document.createTextNode('');
}

function insertNodes(
  nodes: Node[],
  parent: Node | null,
  endMarker: Node,
  frag: DocumentFragment,
  initialized: boolean
): void {
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
