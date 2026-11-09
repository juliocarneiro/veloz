import { createOwner, setCurrentOwner, untrack } from '@velozjs/core';
import { applyProp, applyReactiveProp, eventNameFromProp } from './attributes.js';
import { isHydrating, claimElement } from './hydration-state.js';
import { insertChild, hydrateChild, collectNodes, bindOwner } from './insert.js';
import type { VelozChild } from './types.js';

export { insertChild };

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
// JSX children are created before their parent, so SVG elements are
// recognised by tag name. Tags that also exist in HTML (a, title, style,
// script, image) stay HTML unless written inside <svg> via `innerHTML`.
const SVG_TAGS = new Set([
  'svg', 'animate', 'animateMotion', 'animateTransform', 'circle', 'clipPath', 'defs', 'desc',
  'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight',
  'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur',
  'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'foreignObject',
  'g', 'line', 'linearGradient', 'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern',
  'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'switch', 'symbol', 'text',
  'textPath', 'tspan', 'use', 'view',
]);

let cssPropHandler: ((obj: Record<string, unknown>) => string) | null = null;

export function registerCssPropHandler(handler: (obj: Record<string, unknown>) => string): void {
  cssPropHandler = handler;
}

function toChildArray(children: unknown): VelozChild[] {
  if (children == null) return [];
  return Array.isArray(children) ? children : [children as VelozChild];
}

/** Automatic JSX runtime entry (`jsx`, `jsxs`, `jsxDEV`). */
export function jsx(tag: string | Function, props: Record<string, unknown> | null): unknown {
  props ??= {};
  if (typeof tag === 'function') return createComponent(tag, props, toChildArray(props.children));
  return createHTMLElement(tag, props, toChildArray(props.children));
}

export { jsx as jsxs, jsx as jsxDEV };

/** Classic `h()`-style API: `createElement(tag, props, ...children)`. */
export function createElement(
  tag: string | Function,
  props: Record<string, unknown> | null,
  ...children: VelozChild[]
): any {
  const all = children.length > 0 ? children : toChildArray(props?.children);
  if (typeof tag === 'function') return createComponent(tag, props, all);
  return createHTMLElement(tag, props ?? {}, all);
}

function createHTMLElement(tag: string, props: Record<string, unknown>, children: VelozChild[]): Element {
  const isSVG = SVG_TAGS.has(tag);
  const claimed = isHydrating() ? claimElement(tag) : null;
  const el =
    claimed ??
    (isSVG ? document.createElementNS(SVG_NAMESPACE, tag) : document.createElement(tag));

  let cssClass = props.css && cssPropHandler ? cssPropHandler(props.css as Record<string, unknown>) : '';

  for (const key of Object.keys(props)) {
    if (key === 'children' || key === 'css' || key === 'key') continue;
    const value = props[key];

    if ((key === 'class' || key === 'className') && cssClass) {
      const extra = cssClass;
      cssClass = '';
      if (typeof value === 'function') {
        applyReactiveProp(el, 'class', () => join((value as () => unknown)(), extra), isSVG);
      } else {
        applyProp(el, 'class', join(value, extra), isSVG);
      }
      continue;
    }

    if (typeof value === 'function' && key !== 'ref' && !eventNameFromProp(key)) {
      applyReactiveProp(el, key, value as () => unknown, isSVG);
    } else {
      applyProp(el, key, value, isSVG);
    }
  }

  if (cssClass) el.classList.add(cssClass);

  if (props.innerHTML == null) {
    if (claimed) for (const child of children) hydrateChild(el, child);
    else for (const child of children) insertChild(el, child);
  }

  return el;
}

function join(base: unknown, extra: string): string {
  const b = Array.isArray(base) ? base.filter(Boolean).join(' ') : base ? String(base) : '';
  return b ? `${b} ${extra}` : extra;
}

/**
 * Components run once, untracked, in their own owner. Props are passed as
 * given: functions stay functions (callbacks, render props, accessors).
 * Getter properties are kept as getters.
 */
function createComponent(comp: Function, props: Record<string, unknown> | null, children: VelozChild[]): unknown {
  const componentProps: Record<string, unknown> = {};
  if (props) {
    for (const key of Object.keys(props)) {
      if (key === 'children') continue;
      const descriptor = Object.getOwnPropertyDescriptor(props, key)!;
      Object.defineProperty(componentProps, key, { ...descriptor, enumerable: true, configurable: true });
    }
  }
  if (children.length > 0) componentProps.children = children.length === 1 ? children[0] : children;

  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);
  try {
    return bindOwner(untrack(() => comp(componentProps)), owner);
  } finally {
    setCurrentOwner(prevOwner);
  }
}

export function Fragment(props: { children?: unknown }): unknown {
  return props.children ?? null;
}

/** Resolves any renderable value to DOM nodes (functions become live regions). */
export function toNodes(value: unknown): Node[] {
  const nodes: Node[] = [];
  collectNodes(value, nodes);
  return nodes;
}

export type { JSX } from './types.js';
