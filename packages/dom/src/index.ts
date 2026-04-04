export { render } from './render.js';
export { hydrate } from './hydrate.js';
export { createElement, Fragment, jsx, jsxs, jsxDEV, registerCssPropHandler } from './jsx-runtime.js';
export { sanitize } from './sanitizer.js';
export type { SanitizeOptions } from './sanitizer.js';
export { validateAttribute, sanitizeURL, isExternalURL } from './security.js';
export { setupDelegation, setEventHandler } from './events.js';

export {
  Show,
  For,
  Switch,
  Match,
  Portal,
  ErrorBoundary,
  Suspense,
  Dynamic,
} from './components/index.js';

export type {
  ShowProps,
  ForProps,
  SwitchProps,
  MatchProps,
  PortalProps,
  ErrorBoundaryProps,
  SuspenseProps,
  DynamicProps,
} from './components/index.js';

export type { VelozNode, VelozChild, VelozComponent } from './types.js';
export type { JSX } from './types.js';

export {
  createSignal,
  createEffect,
  createRenderEffect,
  createMemo,
  batch,
  untrack,
  on,
  onMount,
  onCleanup,
  createContext,
  useContext,
} from '@veloz/core';
