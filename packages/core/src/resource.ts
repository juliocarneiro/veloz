import type { Owner } from './types.js';
import { createSignal, batch, untrack } from './signal.js';
import { createEffect } from './effect.js';
import { onCleanup } from './lifecycle.js';
import { getCurrentOwner } from './reactive.js';
import { access, type MaybeAccessor } from './utils.js';

// ---------------------------------------------------------------------------
// Suspense boundaries
// ---------------------------------------------------------------------------

/** What a `<Suspense>` boundary exposes to the resources read inside it. */
export interface SuspenseContext {
  increment(): void;
  decrement(): void;
}

const SUSPENSE = Symbol.for('veloz.suspense');

/** Makes the current owner a Suspense boundary (used by `<Suspense>`). */
export function provideSuspense(ctx: SuspenseContext): void {
  const owner = getCurrentOwner();
  if (owner) owner.context[SUSPENSE] = ctx;
}

function findSuspense(owner: Owner | null): SuspenseContext | null {
  for (let o = owner; o; o = o.parent) {
    const ctx = o.context[SUSPENSE] as SuspenseContext | undefined;
    if (ctx) return ctx;
  }
  return null;
}

// ---------------------------------------------------------------------------
// SSR / hydration hand-off
// ---------------------------------------------------------------------------

/** A settled resource, as stored by SSR and read back during hydration. */
export type ResourceEntry = { v: unknown } | { e: unknown };

const store: {
  data: Record<string, ResourceEntry> | null;
  onPending: ((key: string, promise: Promise<unknown>) => void) | null;
  counter: number;
} = { data: null, onPending: null, counter: 0 };

/**
 * Internal (used by @velozjs/ssr and @velozjs/dom): settled values by key.
 * Resources created while it is set start from these values instead of fetching.
 */
export function setResourceData(data: Record<string, ResourceEntry> | null): void {
  store.data = data;
  store.counter = 0;
}

/** Internal (used by @velozjs/ssr): called for every fetch that returns a promise. */
export function setResourcePendingHandler(fn: ((key: string, promise: Promise<unknown>) => void) | null): void {
  store.onPending = fn;
}

/** Internal: restart automatic keys (`r0`, `r1`...) for a new render pass; returns the previous position. */
export function resetResourceKeys(): number {
  const previous = store.counter;
  store.counter = 0;
  return previous;
}

/** Internal: restore the key position saved by `resetResourceKeys` (nested renders). */
export function restoreResourceKeys(position: number): void {
  store.counter = position;
}

// ---------------------------------------------------------------------------
// createResource
// ---------------------------------------------------------------------------

export type ResourceState = 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored';

export interface Resource<T> {
  /** The latest value (undefined until the first load). Throws if the last load failed. */
  (): T | undefined;
  readonly state: ResourceState;
  /** True while a load is in flight (first load or refetch). */
  readonly loading: boolean;
  readonly error: unknown;
  /** Last successful value; never throws. */
  readonly latest: T | undefined;
}

export interface ResourceActions<T> {
  /** Sets the value locally (optimistic updates). */
  mutate(value: T | undefined): void;
  /** Runs the fetcher again with the current source. */
  refetch(info?: unknown): T | Promise<T> | undefined;
}

export interface ResourceFetcherInfo<T> {
  value: T | undefined;
  refetching: unknown;
}

export interface ResourceOptions<T> {
  initialValue?: T;
  /**
   * Stable key used to hand the server's value to the client. Defaults to
   * creation order, which matches as long as server and client render the
   * same tree.
   */
  name?: string;
}

type Fetcher<S, T> = (source: S, info: ResourceFetcherInfo<T>) => T | Promise<T>;

const isPromise = (v: unknown): v is Promise<unknown> =>
  v != null && typeof (v as { then?: unknown }).then === 'function';

const toError = (e: unknown): unknown =>
  e instanceof Error || e == null || typeof e !== 'object' || !('message' in e)
    ? e
    : Object.assign(new Error(String((e as { message: unknown }).message)), e);

/**
 * Async data as a signal. Reading it inside `<Suspense>` while the first load
 * is pending shows the fallback; a failed load throws on read, so the nearest
 * `<ErrorBoundary>` catches it.
 *
 *   const [user] = createResource(() => fetch('/api/me').then((r) => r.json()));
 *   const [post] = createResource(postId, (id) => getPost(id)); // refetches when postId changes
 */
export function createResource<T>(
  fetcher: (source: true, info: ResourceFetcherInfo<T>) => T | Promise<T>,
  options?: ResourceOptions<T>
): [Resource<T>, ResourceActions<T>];
export function createResource<T, S>(
  source: MaybeAccessor<S | false | null | undefined>,
  fetcher: Fetcher<S, T>,
  options?: ResourceOptions<T>
): [Resource<T>, ResourceActions<T>];
export function createResource<T, S>(
  ...args: [Fetcher<true, T>, ResourceOptions<T>?] | [MaybeAccessor<S | false | null | undefined>, Fetcher<S, T>, ResourceOptions<T>?]
): [Resource<T>, ResourceActions<T>] {
  const hasSource = typeof args[1] === 'function';
  const source = (hasSource ? args[0] : true) as MaybeAccessor<S | false | null | undefined>;
  const fetcher = (hasSource ? args[1] : args[0]) as Fetcher<S, T>;
  const options = ((hasSource ? args[2] : args[1]) ?? {}) as ResourceOptions<T>;

  const [value, setValue] = createSignal<T | undefined>(options.initialValue, { equals: false });
  const [error, setError] = createSignal<unknown>(undefined);
  const [state, setState] = createSignal<ResourceState>(options.initialValue !== undefined ? 'ready' : 'unresolved');

  const key = options.name ?? `r${store.counter++}`;
  const boundaries = new Set<SuspenseContext>();
  let request = 0;
  let lastSource: S | undefined;

  const settle = () => {
    for (const ctx of boundaries) ctx.decrement();
    boundaries.clear();
  };

  const succeed = (v: T) =>
    batch(() => {
      setValue(() => v);
      setError(undefined);
      setState('ready');
    });

  const fail = (e: unknown) =>
    batch(() => {
      setError(() => toError(e));
      setState('errored');
    });

  // Server value from SSR (or an earlier SSR pass): start settled, don't fetch.
  const entry = store.data?.[key];
  let skipFirstLoad = false;
  if (entry) {
    skipFirstLoad = true;
    if ('e' in entry) fail(entry.e);
    else succeed(entry.v as T);
  }

  function load(src: S, refetching: unknown): T | Promise<T> | undefined {
    lastSource = src;
    const id = ++request;
    let result: T | Promise<T>;
    try {
      result = fetcher(src, { value: untrack(value), refetching });
    } catch (e) {
      fail(e);
      settle();
      return undefined;
    }

    if (!isPromise(result)) {
      succeed(result);
      settle();
      return result;
    }

    setState(untrack(value) === undefined ? 'pending' : 'refreshing');
    store.onPending?.(key, result);
    return result.then(
      (v) => {
        if (id !== request) return v;
        succeed(v);
        settle();
        return v;
      },
      (e) => {
        if (id !== request) return undefined as T;
        fail(e);
        settle();
        return undefined as T;
      }
    );
  }

  createEffect(() => {
    const src = access(source);
    if (src == null || src === false) return;
    if (skipFirstLoad) {
      skipFirstLoad = false;
      lastSource = src as S;
      return;
    }
    untrack(() => load(src as S, false));
  });

  onCleanup(() => {
    request++; // ignore late results
    settle();
  });

  const read = (() => {
    const s = state();
    if (s === 'errored') throw error();
    const v = value();
    if (s === 'pending' || s === 'unresolved') {
      const ctx = findSuspense(getCurrentOwner());
      if (ctx && s === 'pending' && !boundaries.has(ctx)) {
        boundaries.add(ctx);
        ctx.increment();
      }
    }
    return v;
  }) as Resource<T>;

  Object.defineProperties(read, {
    state: { get: () => state() },
    loading: { get: () => state() === 'pending' || state() === 'refreshing' },
    error: { get: () => error() },
    latest: { get: () => value() },
  });

  const actions: ResourceActions<T> = {
    mutate: (v) => batch(() => {
      setValue(() => v);
      setError(undefined);
      setState('ready');
    }),
    refetch: (info = true) => {
      const src = lastSource ?? untrack(() => access(source));
      if (src == null || src === false) return undefined;
      return load(src as S, info);
    },
  };

  return [read, actions];
}
