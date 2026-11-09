import {
  createOwner,
  setCurrentOwner,
  disposeOwner,
  resetResourceKeys,
  restoreResourceKeys,
  setResourceData,
  setResourcePendingHandler,
  type ResourceEntry,
} from '@velozjs/core';
import { getSSRStyles } from '@velozjs/css';
import { resetHydrationCounter, restoreHydrationCounter } from './hydration.js';
import { renderChildren } from './jsx-runtime.js';

export interface SSRResult {
  /** The app's HTML, to place inside the element you later `hydrate()`. */
  html: string;
  /** Collected styles, for `<style data-veloz-css>` in the document head. */
  css: string;
}

export interface AsyncSSRResult extends SSRResult {
  /** Settled resources by key (JSON-serializable values). */
  data: Record<string, ResourceEntry>;
  /**
   * `<script>` that hands `data` to `hydrate()`, so the client does not fetch
   * again. Place it before your client entry script.
   */
  script: string;
}

export interface AsyncRenderOptions {
  /** Safety limit for nested data dependencies (default 10 passes). */
  maxPasses?: number;
  /** Rejects if the data takes longer than this (milliseconds). */
  timeout?: number;
  /** CSP nonce for the data script. */
  nonce?: string;
}

/**
 * One synchronous render. Keys restart at 0 and are restored afterwards, so a
 * render nested inside another (e.g. an island rendered as its own root)
 * leaves the outer one intact.
 */
function renderPass(fn: () => unknown): string {
  const hydrationKey = resetHydrationCounter();
  const resourceKey = resetResourceKeys();
  const owner = createOwner();
  const prev = setCurrentOwner(owner);
  try {
    return renderChildren(fn());
  } finally {
    setCurrentOwner(prev);
    disposeOwner(owner);
    restoreHydrationCounter(hydrationKey);
    restoreResourceKeys(resourceKey);
  }
}

/**
 * Renders `fn()` to an HTML string, synchronously. Resources that are still
 * loading render their `<Suspense>` fallback; use `renderToStringAsync` to
 * wait for them.
 */
export function renderToString(fn: () => unknown): SSRResult {
  const html = renderPass(fn);
  return { html, css: getSSRStyles() };
}

/**
 * Renders `fn()` after every resource it reads has loaded: renders, awaits
 * the pending fetches, and renders again with their values (repeating for
 * data that depends on other data). Returns the HTML plus a script that lets
 * `hydrate()` reuse the values.
 */
export async function renderToStringAsync(fn: () => unknown, options: AsyncRenderOptions = {}): Promise<AsyncSSRResult> {
  const maxPasses = options.maxPasses ?? 10;
  const data: Record<string, ResourceEntry> = {};
  const deadline = options.timeout ? Date.now() + options.timeout : Infinity;

  for (let pass = 1; ; pass++) {
    const pending: Promise<unknown>[] = [];
    setResourceData(data);
    setResourcePendingHandler((key, promise) => {
      pending.push(
        promise.then(
          (v) => {
            data[key] = { v };
          },
          (e) => {
            data[key] = { e };
          }
        )
      );
    });

    let html: string;
    try {
      html = renderPass(fn);
    } finally {
      setResourcePendingHandler(null);
      setResourceData(null);
    }

    if (pending.length === 0 || pass >= maxPasses) {
      return { html, css: getSSRStyles(), data, script: dataScript(data, options.nonce) };
    }
    await withDeadline(Promise.all(pending), deadline);
  }
}

function withDeadline<T>(promise: Promise<T>, deadline: number): Promise<T> {
  if (deadline === Infinity) return promise;
  const ms = Math.max(0, deadline - Date.now());
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[Veloz SSR] Data did not load within the timeout.`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

// U+2028 / U+2029 are valid in JSON but end a line in older JS parsers.
const LINE_SEPARATORS = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');

/** JSON that is safe inside a `<script>` element. */
export function serializeData(data: Record<string, ResourceEntry>): string {
  const plain: Record<string, ResourceEntry> = {};
  for (const [key, entry] of Object.entries(data)) {
    plain[key] =
      'e' in entry
        ? { e: { message: entry.e instanceof Error ? entry.e.message : String(entry.e) } }
        : entry;
  }
  return JSON.stringify(plain)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATORS, (c) => '\\u' + c.charCodeAt(0).toString(16));
}

function dataScript(data: Record<string, ResourceEntry>, nonce?: string): string {
  if (Object.keys(data).length === 0) return '';
  const attr = nonce ? ` nonce="${nonce.replace(/"/g, '&quot;')}"` : '';
  return `<script${attr}>window.__veloz_data=${serializeData(data)}</script>`;
}
