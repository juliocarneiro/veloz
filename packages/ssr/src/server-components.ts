import { renderChildren } from './jsx-runtime.js';
import { jsx } from './jsx-runtime.js';

export interface ShowProps<T> {
  when: T | undefined | null | false | (() => T | undefined | null | false);
  fallback?: unknown;
  children: unknown | ((value: T) => unknown);
}

export function Show<T>(props: ShowProps<T>): string {
  const raw = props.when;
  const condition = typeof raw === 'function' ? (raw as () => unknown)() : raw;

  if (condition) {
    if (typeof props.children === 'function') {
      return renderChildren((props.children as (value: T) => unknown)(condition as T));
    }
    return renderChildren(props.children);
  }

  if (props.fallback != null) {
    return renderChildren(props.fallback);
  }

  return '';
}

export interface ForProps<T> {
  each: T[] | (() => T[]);
  fallback?: unknown;
  children: (item: T, index: () => number) => unknown;
}

export function For<T>(props: ForProps<T>): string {
  const raw = props.each;
  const items = (typeof raw === 'function' ? (raw as () => T[])() : raw) ?? [];

  if (items.length === 0) {
    if (props.fallback != null) {
      return renderChildren(props.fallback);
    }
    return '';
  }

  let result = '';
  for (let i = 0; i < items.length; i++) {
    const index = i;
    const content = props.children(items[i], () => index);
    result += renderChildren(content);
  }
  return result;
}

export interface MatchProps<T> {
  when: T | undefined | null | false;
  children: unknown | ((value: T) => unknown);
}

export function Match<T>(props: MatchProps<T>): MatchProps<T> {
  return props;
}

export interface SwitchProps {
  fallback?: unknown;
  children: MatchProps<unknown>[] | MatchProps<unknown>;
}

export function Switch(props: SwitchProps): string {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children];

  for (const match of children) {
    if (match && match.when) {
      if (typeof match.children === 'function') {
        return renderChildren(
          (match.children as (v: unknown) => unknown)(match.when)
        );
      }
      return renderChildren(match.children);
    }
  }

  if (props.fallback != null) {
    return renderChildren(props.fallback);
  }

  return '';
}

export interface PortalProps {
  mount?: unknown;
  children?: unknown;
}

export function Portal(props: PortalProps): string {
  return renderChildren(props.children);
}

export interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => unknown;
  children?: unknown;
}

export function ErrorBoundary(props: ErrorBoundaryProps): string {
  try {
    return renderChildren(props.children);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const noop = () => {};
    return renderChildren(props.fallback(error, noop));
  }
}

export interface SuspenseProps {
  fallback?: unknown;
  children?: unknown;
}

export function Suspense(props: SuspenseProps): string {
  return renderChildren(props.children);
}

export interface DynamicProps<T extends string | Function> {
  component: T;
  [key: string]: unknown;
}

export function Dynamic<T extends string | Function>(
  props: DynamicProps<T>
): string {
  const { component, ...rest } = props;
  if (!component) return '';

  const result = jsx(component, rest);
  return typeof result === 'object' && result !== null && 'value' in result
    ? (result as { value: string }).value
    : String(result);
}
