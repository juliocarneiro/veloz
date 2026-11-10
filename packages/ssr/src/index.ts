import { setElementFactory } from '@velozjs/css';
import { jsx } from './jsx-runtime.js';

// styled() components create elements through the active runtime: on the
// server, that is this string renderer.
setElementFactory((tag, props) => jsx(tag, props));

export { renderToString, renderToStringAsync, serializeData } from './render-to-string.js';
export type { SSRResult, AsyncSSRResult, AsyncRenderOptions } from './render-to-string.js';
export { renderToStream } from './render-to-stream.js';
export { escapeHTML, escapeAttr } from './escape.js';
export { resetHydrationCounter } from './hydration.js';
export { jsx, jsxs, jsxDEV, Fragment, renderChildren } from './jsx-runtime.js';
export { validateAttribute, sanitizeURL, isExternalURL } from './security.js';

export { Show, For, Switch, Match, Portal, ErrorBoundary, Dynamic, Suspense } from './server-components.js';
export type {
  ShowProps,
  ForProps,
  SwitchProps,
  MatchProps,
  PortalProps,
  ErrorBoundaryProps,
  DynamicProps,
  SuspenseProps,
} from './server-components.js';

// Same names as @velozjs/dom, so app code runs unchanged on the server.
export {
  createSignal,
  createRenderEffect,
  createMemo,
  createRoot,
  batch,
  untrack,
  on,
  onCleanup,
  createContext,
  useContext,
  catchError,
  access,
  getCurrentOwner,
  runWithOwner,
  createResource,
} from '@velozjs/core';
export type {
  Getter,
  Setter,
  Signal,
  Context,
  MaybeAccessor,
  Owner,
  SignalOptions,
  Resource,
  ResourceActions,
  ResourceOptions,
  ResourceState,
} from '@velozjs/core';

/**
 * Effects and onMount are for browser side effects (DOM, timers, storage),
 * so they don't run during server rendering. Memos and resources do.
 */
export function createEffect<T>(_fn: (prev: T | undefined) => T, _initialValue?: T): void {}
export function onMount(_fn: () => void): void {}

/** Browser-only entry points, so shared code can import them from either package. */
export function render(): () => void {
  throw new Error('[Veloz SSR] render() runs in the browser. Use renderToString() on the server.');
}
export function hydrate(): () => void {
  throw new Error('[Veloz SSR] hydrate() runs in the browser. Use renderToString() on the server.');
}
/** JSX without a compiler, same signature as in @velozjs/dom. */
export function createElement(tag: string | Function, props: Record<string, unknown> | null, ...children: unknown[]): any {
  if (children.length === 0) return jsx(tag, props);
  return jsx(tag, { ...props, children: children.length === 1 ? children[0] : children });
}

/** DOM-only helpers. They exist here so shared code can import them; on the server they do nothing. */
export function setupDelegation(): void {}
export function setEventHandler(): void {}
export function registerCssPropHandler(): void {}
export function toNodes(): never {
  throw new Error('[Veloz SSR] toNodes() needs the DOM. Call it in the browser, e.g. inside onMount().');
}

export function sanitize(html: string): string {
  return html.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
