import {
  createMemo,
  createRoot,
  createSignal,
  onCleanup,
  untrack,
  access,
  type Getter,
  type MaybeAccessor,
  type Setter,
} from '@velozjs/core';
import { insertChild, nodesBetween } from '../insert.js';
import type { VelozNode } from '../types.js';

export interface ForProps<T> {
  each: MaybeAccessor<readonly T[] | undefined | null | false>;
  fallback?: unknown;
  /** Called once per item; `index` updates when the item moves. */
  children: (item: T, index: Getter<number>) => VelozNode | unknown;
}

interface Row<T> {
  item: T;
  start: Node;
  end: Node;
  setIndex: Setter<number>;
  dispose: () => void;
}

/**
 * Keyed list: rows are matched by item identity, so existing rows (their DOM,
 * focus and state) are kept and only moved, added or removed.
 */
export function For<T>(props: ForProps<T>): () => unknown {
  let rows: Row<T>[] = [];

  onCleanup(() => {
    for (const row of rows) row.dispose();
    rows = [];
  });

  const mapped = createMemo(
    () => {
      const items = access(props.each) || [];
      return untrack(() => {
        // Reuse rows by identity; duplicates are matched in order.
        const pool = new Map<T, Row<T>[]>();
        for (const row of rows) {
          const list = pool.get(row.item);
          if (list) list.push(row);
          else pool.set(row.item, [row]);
        }

        const next: Row<T>[] = new Array(items.length);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const reused = pool.get(item)?.shift();
          if (reused) {
            reused.setIndex(i);
            next[i] = reused;
          } else {
            next[i] = createRow(item, i, props.children);
          }
        }

        for (const list of pool.values()) for (const row of list) row.dispose();
        rows = next;
        return next;
      });
    },
    undefined,
    { equals: false }
  );

  return () => {
    const list = mapped();
    if (list.length === 0) return props.fallback ?? null;
    const nodes: Node[] = [];
    for (const row of list) nodes.push(...nodesBetween(row.start, row.end));
    return nodes;
  };
}

function createRow<T>(
  item: T,
  index: number,
  render: (item: T, index: Getter<number>) => unknown
): Row<T> {
  return createRoot((dispose) => {
    const [getIndex, setIndex] = createSignal(index);
    // Markers delimit the row, so content that grows later moves with it.
    const frag = document.createDocumentFragment();
    const start = frag.appendChild(document.createTextNode(''));
    insertChild(frag, render(item, getIndex));
    const end = frag.appendChild(document.createTextNode(''));
    return { item, start, end, setIndex, dispose };
  });
}
