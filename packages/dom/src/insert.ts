import { createRenderEffect, runWithOwner, type Owner } from '@velozjs/core';
import { isHydrating, claimRegion } from './hydration-state.js';

/**
 * A dynamic child lives between two marker nodes. Updates replace whatever is
 * between them, so content that grows on its own (nested regions, list rows)
 * is always cleaned up, and nodes that stay are not moved.
 */

/** Appends `child` to `parent`. Functions become reactive regions. */
export function insertChild(parent: Node, child: unknown): void {
  if (child == null || typeof child === 'boolean') return;

  if (typeof child === 'function') {
    const start = document.createTextNode('');
    const end = document.createTextNode('');
    parent.appendChild(start);
    parent.appendChild(end);
    createRegion(start, end, child as () => unknown);
    return;
  }

  if (Array.isArray(child)) {
    for (const item of child) insertChild(parent, item);
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * Hydration counterpart of `insertChild`: static content is already in the
 * server HTML; functions attach to the matching server region.
 */
export function hydrateChild(parent: Node, child: unknown): void {
  if (child == null || typeof child === 'boolean') return;

  if (typeof child === 'function') {
    const region = claimRegion(parent);
    if (region) {
      createRegion(region.start, region.end, child as () => unknown);
    } else {
      insertChild(parent, child);
    }
    return;
  }

  if (Array.isArray(child)) {
    for (const item of child) hydrateChild(parent, item);
    return;
  }

  // Elements claimed from the server are already in place; anything the
  // server did not render gets appended.
  if (child instanceof Node && !child.parentNode) parent.appendChild(child);
}

const OWNER = Symbol('veloz.owner');
type OwnedFn = (() => unknown) & { [OWNER]?: Owner };

/**
 * Functions returned by a component are tagged with its owner, so the region
 * created for them later (when the parent inserts them) is owned by that
 * component: context lookups and disposal follow the component tree.
 */
export function bindOwner(value: unknown, owner: Owner): unknown {
  if (typeof value === 'function') {
    if ((value as OwnedFn)[OWNER]) return value;
    const fn = value as () => unknown;
    const bound: OwnedFn = () => fn();
    bound[OWNER] = owner;
    return bound;
  }
  if (Array.isArray(value)) return value.map((v) => bindOwner(v, owner));
  return value;
}

function createRegion(start: Node, end: Node, fn: OwnedFn): void {
  const run = () =>
    createRenderEffect(() => {
      updateRegion(start, end, fn());
    });
  const owner = fn[OWNER];
  if (owner && !owner.disposed) runWithOwner(owner, run);
  else run();
}

function updateRegion(start: Node, end: Node, value: unknown): void {
  const parent = end.parentNode;
  if (!parent) return;

  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value);
    const first = start.nextSibling;
    // Fast path: a single text node already there (also matches server text).
    if (first && first !== end && first.nodeType === 3 && first.nextSibling === end) {
      if ((first as Text).data !== text) (first as Text).data = text;
      return;
    }
    reconcile(parent, start, end, text === '' ? [] : [document.createTextNode(text)]);
    return;
  }

  const nodes: Node[] = [];
  collectNodes(value, nodes);
  reconcile(parent, start, end, nodes);
}

/** Flattens a value into nodes; nested functions become their own regions. */
export function collectNodes(value: unknown, out: Node[]): void {
  if (value == null || typeof value === 'boolean') return;

  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, out);
    return;
  }

  if (value instanceof DocumentFragment) {
    out.push(...Array.from(value.childNodes));
    return;
  }

  if (value instanceof Node) {
    out.push(value);
    return;
  }

  if (typeof value === 'function') {
    const frag = document.createDocumentFragment();
    insertChild(frag, value);
    out.push(...Array.from(frag.childNodes));
    return;
  }

  const text = String(value);
  if (text !== '') out.push(document.createTextNode(text));
}

function reconcile(parent: Node, start: Node, end: Node, nodes: Node[]): void {
  const keep = new Set(nodes);
  let node = start.nextSibling;
  while (node && node !== end) {
    const next = node.nextSibling;
    if (!keep.has(node)) parent.removeChild(node);
    node = next;
  }

  let ref: Node = end;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.parentNode !== parent || n.nextSibling !== ref) parent.insertBefore(n, ref);
    ref = n;
  }
}

/** Nodes from `start` to `end`, inclusive (used for list rows). */
export function nodesBetween(start: Node, end: Node): Node[] {
  const nodes: Node[] = [start];
  let node: Node | null = start;
  while (node && node !== end) {
    node = node.nextSibling;
    if (node) nodes.push(node);
  }
  return nodes;
}

/** True while hydrating; re-exported for components. */
export { isHydrating };
