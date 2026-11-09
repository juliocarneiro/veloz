export { render } from './render.js';
export { hydrate } from './hydrate.js';
export { createElement, Fragment, jsx, jsxs, jsxDEV, registerCssPropHandler, toNodes } from './jsx-runtime.js';
export { sanitize } from './sanitizer.js';
export type { SanitizeOptions } from './sanitizer.js';
export { validateAttribute, sanitizeURL, isExternalURL } from './security.js';
export { setupDelegation, setEventHandler } from './events.js';

export { Show, For, Switch, Match, Portal, ErrorBoundary, Dynamic, Suspense } from './components/index.js';
export type {
  ShowProps,
  ForProps,
  SwitchProps,
  MatchProps,
  PortalProps,
  ErrorBoundaryProps,
  DynamicProps,
  SuspenseProps,
} from './components/index.js';

export type { VelozNode, VelozChild, VelozComponent, VelozElement } from './types.js';
export type { JSX } from './types.js';

// Re-export the reactive core so apps can import everything from one place.
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
