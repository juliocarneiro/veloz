import {
  createEffect,
  createOwner,
  setCurrentOwner,
} from '@veloz/core';
import { applyProp, applyReactiveProp } from './attributes.js';
import { isHydrating, nextHydrationNode } from './hydration-state.js';
import type { VelozChild } from './types.js';

let _cssPropHandler: ((obj: Record<string, unknown>) => string) | null = null;

export function registerCssPropHandler(
  handler: (obj: Record<string, unknown>) => string
): void {
  _cssPropHandler = handler;
}

export function jsx(
  tag: string | Function,
  props: Record<string, unknown> | null
): Node | Node[] {
  if (!props) props = {};

  const { children, ...restProps } = props;
  const childArray: VelozChild[] = children != null
    ? Array.isArray(children) ? children : [children as VelozChild]
    : [];

  if (typeof tag === 'function') {
    return createComponent(tag, props, childArray);
  }

  return createHTMLElement(tag, restProps, childArray);
}

export { jsx as jsxs, jsx as jsxDEV };

export function createElement(
  tag: string,
  props: Record<string, unknown> | null,
  ...children: VelozChild[]
): Node;
export function createElement(
  tag: Function,
  props: Record<string, unknown> | null,
  ...children: VelozChild[]
): Node | Node[];
export function createElement(
  tag: string | Function,
  props: Record<string, unknown> | null,
  ...children: VelozChild[]
): Node | Node[] {
  if (typeof tag === 'function') {
    return createComponent(tag, props, children);
  }

  const restProps: Record<string, unknown> = {};
  if (props) {
    for (const key of Object.keys(props)) {
      if (key !== 'children') restProps[key] = props[key];
    }
  }

  const allChildren =
    props?.children != null
      ? Array.isArray(props.children)
        ? props.children
        : [props.children]
      : children;

  return createHTMLElement(tag, restProps, allChildren);
}

function createHTMLElement(
  tag: string,
  props: Record<string, unknown>,
  children: VelozChild[]
): HTMLElement {
  const isSVG = tag === 'svg' || tag === 'foreignObject';
  let el: HTMLElement;

  if (isHydrating()) {
    const hk = nextHydrationNode();
    const found = document.querySelector(`[data-hk="${hk}"]`) as HTMLElement | null;
    if (found) {
      el = found;
      el.removeAttribute('data-hk');
    } else {
      el = isSVG
        ? (document.createElementNS('http://www.w3.org/2000/svg', tag) as unknown as HTMLElement)
        : document.createElement(tag);
    }
  } else {
    el = isSVG
      ? (document.createElementNS('http://www.w3.org/2000/svg', tag) as unknown as HTMLElement)
      : document.createElement(tag);
  }

  let cssClass: string | undefined;
  if (props.css && _cssPropHandler) {
    cssClass = _cssPropHandler(props.css as Record<string, unknown>);
  }

  for (const key of Object.keys(props)) {
    if (key === 'css') continue;
    const value = props[key];

    if (key === 'class' || key === 'className') {
      if (cssClass) {
        const base = typeof value === 'function' ? value : value;
        if (typeof base === 'function') {
          applyReactiveProp(el, 'class', () => `${(base as () => string)()} ${cssClass}`, isSVG);
        } else {
          applyProp(el, 'class', base ? `${base} ${cssClass}` : cssClass, isSVG);
        }
        cssClass = undefined;
        continue;
      }
    }

    if (typeof value === 'function' && !key.startsWith('on') && key !== 'ref') {
      applyReactiveProp(el, key, value as () => unknown, isSVG);
    } else {
      applyProp(el, key, value, isSVG);
    }
  }

  if (cssClass) {
    const existing = el.className;
    el.className = existing ? `${existing} ${cssClass}` : cssClass;
  }

  if (!isHydrating()) {
    for (const child of children) {
      insertChild(el, child);
    }
  } else {
    for (const child of children) {
      hydrateChild(el, child);
    }
  }

  return el;
}

function createComponent(
  comp: Function,
  props: Record<string, unknown> | null,
  children: VelozChild[]
): Node | Node[] {
  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);

  const componentProps: Record<string, unknown> = Object.create(null);

  if (props) {
    for (const key of Object.keys(props)) {
      if (key === 'children') continue;
      const descriptor = Object.getOwnPropertyDescriptor(props, key);

      if (descriptor && typeof descriptor.get === 'function') {
        Object.defineProperty(componentProps, key, {
          get: descriptor.get,
          enumerable: true,
          configurable: true,
        });
      } else {
        const value = props[key];
        if (typeof value === 'function' && !key.startsWith('on') && key !== 'ref') {
          Object.defineProperty(componentProps, key, {
            get: value as () => unknown,
            enumerable: true,
            configurable: true,
          });
        } else {
          componentProps[key] = value;
        }
      }
    }
  }

  if (children.length > 0) {
    componentProps.children = children.length === 1 ? children[0] : children;
  } else if (props?.children != null) {
    componentProps.children = props.children;
  }

  try {
    const result = comp(componentProps);
    return normalizeNode(result);
  } finally {
    setCurrentOwner(prevOwner);
  }
}

export function insertChild(parent: Node, child: unknown): void {
  if (child == null || typeof child === 'boolean') return;

  if (typeof child === 'string' || typeof child === 'number') {
    parent.appendChild(document.createTextNode(String(child)));
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  if (Array.isArray(child)) {
    for (const item of child) {
      insertChild(parent, item);
    }
    return;
  }

  if (typeof child === 'function') {
    const marker = document.createTextNode('');
    parent.appendChild(marker);
    let prevNode: Node | null = null;

    createEffect(() => {
      const value = (child as () => unknown)();
      if (prevNode && prevNode.parentNode) {
        prevNode.parentNode.removeChild(prevNode);
        prevNode = null;
      }
      if (value instanceof Node) {
        if (marker.parentNode) {
          marker.parentNode.insertBefore(value, marker);
          prevNode = value;
        }
      } else if (value != null && typeof value !== 'boolean') {
        marker.textContent = String(value);
      } else {
        marker.textContent = '';
      }
    });
    return;
  }
}

function hydrateChild(parent: Node, child: unknown): void {
  if (child == null || typeof child === 'boolean') return;
  if (typeof child === 'string' || typeof child === 'number') return;
  if (child instanceof Node) return;

  if (Array.isArray(child)) {
    for (const item of child) {
      hydrateChild(parent, item);
    }
    return;
  }

  if (typeof child === 'function') {
    const existingText = findHydrationTextNode(parent);
    const marker = existingText ?? document.createTextNode('');
    if (!existingText) parent.appendChild(marker);
    let prevNode: Node | null = null;

    createEffect(() => {
      const value = (child as () => unknown)();
      if (prevNode && prevNode.parentNode) {
        prevNode.parentNode.removeChild(prevNode);
        prevNode = null;
      }
      if (value instanceof Node) {
        if (marker.parentNode) {
          marker.parentNode.insertBefore(value, marker);
          prevNode = value;
        }
      } else if (value != null && typeof value !== 'boolean') {
        marker.textContent = String(value);
      } else {
        marker.textContent = '';
      }
    });
  }
}

let _hydrationTextIdx = 0;

function findHydrationTextNode(parent: Node): Text | null {
  const children = parent.childNodes;
  for (let i = _hydrationTextIdx; i < children.length; i++) {
    if (children[i].nodeType === 3) {
      _hydrationTextIdx = i + 1;
      return children[i] as Text;
    }
  }
  return null;
}

function normalizeNode(value: unknown): Node | Node[] {
  if (value instanceof Node) return value;
  if (Array.isArray(value)) {
    const nodes: Node[] = [];
    for (const item of value) {
      const n = normalizeNode(item);
      if (Array.isArray(n)) nodes.push(...n);
      else if (n) nodes.push(n);
    }
    return nodes;
  }
  if (value == null || typeof value === 'boolean') {
    return document.createTextNode('');
  }
  return document.createTextNode(String(value));
}

export function Fragment(props: { children?: unknown }): Node | Node[] {
  const children = props.children;
  if (children == null) return document.createTextNode('');

  if (Array.isArray(children)) {
    const frag = document.createDocumentFragment();
    for (const child of children) {
      insertChild(frag, child);
    }
    return Array.from(frag.childNodes);
  }

  return normalizeNode(children);
}

export type { JSX } from './types.js';
