import { createEffect } from '@veloz/core';
import type { VelozNode } from '../types.js';

export interface MatchProps<T> {
  when: T | undefined | null | false;
  children: VelozNode | ((value: T) => VelozNode);
}

export function Match<T>(props: MatchProps<T>): MatchProps<T> {
  return props;
}

export interface SwitchProps {
  fallback?: VelozNode;
  children: MatchProps<unknown>[] | MatchProps<unknown>;
}

export function Switch(props: SwitchProps): Node {
  const marker = document.createComment('Switch');
  let currentNodes: Node[] = [];

  createEffect(() => {
    const children = Array.isArray(props.children)
      ? props.children
      : [props.children];

    clearNodes(currentNodes);
    currentNodes = [];

    const parent = marker.parentNode;
    if (!parent) return;

    for (const match of children) {
      if (match && match.when) {
        let content: unknown;
        if (typeof match.children === 'function') {
          content = (match.children as (v: unknown) => VelozNode)(match.when);
        } else {
          content = match.children;
        }
        currentNodes = insertNodes(parent, marker, content);
        return;
      }
    }

    if (props.fallback != null) {
      currentNodes = insertNodes(parent, marker, props.fallback);
    }
  });

  return marker;
}

function clearNodes(nodes: Node[]): void {
  for (const node of nodes) {
    node.parentNode?.removeChild(node);
  }
}

function insertNodes(parent: Node, before: Node, content: unknown): Node[] {
  const nodes: Node[] = [];
  if (content instanceof Node) {
    parent.insertBefore(content, before);
    nodes.push(content);
  } else if (Array.isArray(content)) {
    for (const item of content) {
      nodes.push(...insertNodes(parent, before, item));
    }
  } else if (content != null && typeof content !== 'boolean') {
    const text = document.createTextNode(String(content));
    parent.insertBefore(text, before);
    nodes.push(text);
  }
  return nodes;
}
