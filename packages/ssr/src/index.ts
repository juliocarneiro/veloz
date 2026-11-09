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
  createEffect,
  createRenderEffect,
  createMemo,
  createRoot,
  batch,
  untrack,
  on,
  onMount,
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

/** No-ops on the server, so shared code can import them from either package. */
export function render(): () => void {
  throw new Error('[Veloz SSR] render() runs in the browser. Use renderToString() on the server.');
}
export function hydrate(): () => void {
  throw new Error('[Veloz SSR] hydrate() runs in the browser. Use renderToString() on the server.');
}
export function sanitize(html: string): string {
  return html.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
