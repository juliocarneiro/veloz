import { access, catchError, provideSuspense, type MaybeAccessor } from '@velozjs/core';
import { jsx, renderChildren, rawHTML, type RawHTML } from './jsx-runtime.js';

/*
 * Server versions of the control-flow components. They mirror the client:
 * what the client evaluates eagerly (conditions, list rows) is evaluated
 * here when the component runs; what the client renders in a region is
 * returned as a function, which the runtime wraps in region markers.
 */

const MATCH = Symbol.for('veloz.match');

export interface ShowProps<T> {
  when: MaybeAccessor<T | undefined | null | false>;
  fallback?: unknown;
  children?: unknown | ((value: NonNullable<T>) => unknown);
}

export function Show<T>(props: ShowProps<T>): () => unknown {
  const value = access(props.when);
  return () => {
    if (!value) return props.fallback ?? null;
    const children = props.children;
    return typeof children === 'function' ? (children as (v: NonNullable<T>) => unknown)(value as NonNullable<T>) : children;
  };
}

export interface ForProps<T> {
  each: MaybeAccessor<readonly T[] | undefined | null | false>;
  fallback?: unknown;
  children: (item: T, index: () => number) => unknown;
}

export function For<T>(props: ForProps<T>): () => unknown {
  const items = access(props.each) || [];
  // Rows are created up front, like the client's keyed map.
  let html = '';
  for (let i = 0; i < items.length; i++) {
    const index = i;
    html += renderChildren(props.children(items[i], () => index));
  }
  return () => (items.length === 0 ? (props.fallback ?? null) : rawHTML(html));
}

export interface MatchProps<T> {
  when: MaybeAccessor<T | undefined | null | false>;
  children?: unknown | ((value: NonNullable<T>) => unknown);
}

interface MatchDescriptor {
  [MATCH]: true;
  props: MatchProps<unknown>;
}

export function Match<T>(props: MatchProps<T>): any {
  return { [MATCH]: true, props } satisfies MatchDescriptor;
}

export interface SwitchProps {
  fallback?: unknown;
  children?: unknown;
}

function collectMatches(children: unknown, out: MatchDescriptor[]): MatchDescriptor[] {
  if (Array.isArray(children)) for (const c of children) collectMatches(c, out);
  else if (children != null && typeof children === 'object' && MATCH in children) out.push(children as MatchDescriptor);
  return out;
}

export function Switch(props: SwitchProps): () => unknown {
  const matches = collectMatches(props.children, []);
  let selected: { match: MatchDescriptor; value: unknown } | null = null;
  for (const match of matches) {
    const value = access(match.props.when);
    if (value) {
      selected = { match, value };
      break;
    }
  }
  return () => {
    if (!selected) return props.fallback ?? null;
    const children = selected.match.props.children;
    return typeof children === 'function' ? (children as (v: unknown) => unknown)(selected.value) : children;
  };
}

export interface PortalProps {
  mount?: unknown;
  children?: unknown;
}

/** Portals render on the client only (their target is not part of this HTML). */
export function Portal(_props: PortalProps): RawHTML {
  return rawHTML('');
}

export interface ErrorBoundaryProps {
  fallback: unknown | ((error: Error, reset: () => void) => unknown);
  children?: unknown;
}

export function ErrorBoundary(props: ErrorBoundaryProps): () => unknown {
  return () => {
    let failed: Error | null = null;
    const html = catchError(
      () => {
        const children = props.children;
        return renderChildren(typeof children === 'function' ? (children as () => unknown)() : children);
      },
      (err) => {
        failed = err instanceof Error ? err : new Error(String(err));
      }
    );
    if (!failed) return rawHTML(html ?? '');
    const fallback = props.fallback;
    return typeof fallback === 'function' ? (fallback as (e: Error, r: () => void) => unknown)(failed, () => {}) : fallback;
  };
}

export interface DynamicProps {
  component: string | ((props: any) => unknown) | null | undefined | false;
  [key: string]: unknown;
}

export function Dynamic(props: DynamicProps): unknown {
  const { component, ...rest } = props;
  if (!component) return null;
  return jsx(component, rest);
}

export interface SuspenseProps {
  fallback?: unknown;
  children?: unknown;
}

/**
 * Renders the content when every resource read inside is settled, the
 * fallback otherwise. With renderToStringAsync the data is awaited first, so
 * the content is what gets sent.
 */
export function Suspense(props: SuspenseProps): () => unknown {
  let pending = 0;
  provideSuspense({
    increment: () => pending++,
    decrement: () => {
      pending = Math.max(0, pending - 1);
    },
  });
  // Created up front, like the client, so hydration keys stay in order.
  const html = renderChildren(props.children);
  return () => (pending > 0 ? (props.fallback ?? null) : rawHTML(html));
}
