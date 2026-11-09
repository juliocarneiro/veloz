/**
 * Hydration bookkeeping. Server-rendered elements carry `data-hk` keys that
 * follow creation order; on hydrate we index them once per container (O(n))
 * and claim them as the client creates the same elements.
 */
let hydrating = false;
let pointer = 0;
let registry: Map<string, Element> | null = null;
/** Last region end marker consumed in each parent, so regions match in order. */
let regionCursor = new WeakMap<Node, Node>();

export function isHydrating(): boolean {
  return hydrating;
}

export function startHydration(container: Element): void {
  registry = new Map();
  for (const el of container.querySelectorAll('[data-hk]')) {
    registry.set(el.getAttribute('data-hk')!, el);
  }
  pointer = 0;
  regionCursor = new WeakMap();
  hydrating = true;
}

export function endHydration(): void {
  hydrating = false;
  registry = null;
}

/** Runs `fn` with hydration paused (content created fresh, e.g. Portals). */
export function withoutHydration<T>(fn: () => T): T {
  const prev = hydrating;
  hydrating = false;
  try {
    return fn();
  } finally {
    hydrating = prev;
  }
}

/** Takes the next key and returns the server element for it, if any. */
export function claimElement(tag: string): Element | null {
  const key = String(pointer++);
  const el = registry?.get(key);
  if (!el || el.localName !== tag.toLowerCase()) return null;
  registry!.delete(key);
  el.removeAttribute('data-hk');
  return el;
}

const START = '[';
const END = ']';

/**
 * Finds the next server region (`<!--[-->...<!--]-->`) inside `parent`,
 * after the previously claimed one. Returns its start and end comments.
 */
export function claimRegion(parent: Node): { start: Node; end: Node } | null {
  const last = regionCursor.get(parent);
  let node: Node | null = last ? last.nextSibling : parent.firstChild;

  while (node && !(node.nodeType === 8 && (node as Comment).data === START)) {
    node = node.nextSibling;
  }
  if (!node) return null;

  const start = node;
  let depth = 0;
  for (node = start.nextSibling; node; node = node.nextSibling) {
    if (node.nodeType !== 8) continue;
    const data = (node as Comment).data;
    if (data === START) depth++;
    else if (data === END) {
      if (depth === 0) {
        regionCursor.set(parent, node);
        return { start, end: node };
      }
      depth--;
    }
  }
  return null;
}
