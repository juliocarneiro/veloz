import type { Owner, Computation, SignalNode } from './types.js';
import { ComputationState } from './types.js';

const { Clean, Pending, Dirty } = ComputationState;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_FLUSH_ITERATIONS = 100_000;
const ERROR_HANDLER = Symbol.for('veloz.error');

let currentObserver: Computation | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let flushing = false;
const queue: Computation[] = [];

// ---------------------------------------------------------------------------
// Observer / owner context
// ---------------------------------------------------------------------------

export function getCurrentObserver(): Computation | null {
  return currentObserver;
}

export function setCurrentObserver(c: Computation | null): Computation | null {
  const prev = currentObserver;
  currentObserver = c;
  return prev;
}

export function getCurrentOwner(): Owner | null {
  return currentOwner;
}

export function setCurrentOwner(o: Owner | null): Owner | null {
  const prev = currentOwner;
  currentOwner = o;
  return prev;
}

export function createOwner(): Owner {
  const owner: Owner = {
    parent: currentOwner,
    children: [],
    cleanups: [],
    context: Object.create(null),
    disposed: false,
  };
  if (currentOwner) currentOwner.children.push(owner);
  return owner;
}

/**
 * Creates a computation node. The same object is registered as a child of
 * the current owner, so disposing the owner also unsubscribes it.
 */
export function createComputationNode<T>(
  fn: ((prev: T | undefined) => T) | null,
  value?: T
): Computation<T> {
  const comp: Computation<T> = {
    parent: currentOwner,
    children: [],
    cleanups: [],
    context: Object.create(null),
    disposed: false,
    fn,
    value,
    sources: new Set(),
    state: Dirty,
    node: null,
  };
  if (currentOwner) currentOwner.children.push(comp as Computation);
  return comp;
}

function isComputation(owner: Owner): owner is Computation {
  return 'sources' in owner;
}

export function disposeOwner(owner: Owner): void {
  if (owner.disposed) return;
  owner.disposed = true;

  disposeChildren(owner);
  runCleanups(owner);

  if (isComputation(owner)) {
    unsubscribe(owner);
    owner.fn = null;
    owner.state = Clean;
  }

  if (owner.parent) {
    const siblings = owner.parent.children;
    const idx = siblings.indexOf(owner);
    if (idx !== -1) siblings.splice(idx, 1);
    owner.parent = null;
  }
}

function disposeChildren(owner: Owner): void {
  const children = owner.children;
  owner.children = [];
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    child.parent = null; // already detached; skip the splice
    disposeOwner(child);
  }
}

function runCleanups(owner: Owner): void {
  const cleanups = owner.cleanups;
  owner.cleanups = [];
  let error: unknown = null;
  for (let i = cleanups.length - 1; i >= 0; i--) {
    try {
      cleanups[i]();
    } catch (err) {
      error ??= err;
    }
  }
  if (error) throw error;
}

export function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  const prevOwner = setCurrentOwner(owner);
  try {
    return fn();
  } finally {
    setCurrentOwner(prevOwner);
  }
}

/**
 * Runs `fn` in a new, untracked owner scope that is not disposed with its
 * parent. Call the `dispose` argument to tear it down.
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const root: Owner = {
    parent: currentOwner, // context lookup only; not registered as a child
    children: [],
    cleanups: [],
    context: Object.create(null),
    disposed: false,
  };
  const prevOwner = setCurrentOwner(root);
  const prevObserver = setCurrentObserver(null);
  try {
    return fn(() => disposeOwner(root));
  } finally {
    setCurrentOwner(prevOwner);
    setCurrentObserver(prevObserver);
  }
}

// ---------------------------------------------------------------------------
// Dependency tracking
// ---------------------------------------------------------------------------

export function trackRead<T>(node: SignalNode<T>): void {
  const observer = currentObserver;
  if (observer === null || observer.disposed) return;
  const n = node as SignalNode<unknown>;
  if (observer.sources.has(n)) return;
  observer.sources.add(n);
  n.observers.add(observer);
}

function unsubscribe(comp: Computation): void {
  for (const source of comp.sources) source.observers.delete(comp);
  comp.sources.clear();
}

function mark(comp: Computation, state: ComputationState): void {
  if (comp.disposed || comp.state >= state) return;
  const wasClean = comp.state === Clean;
  comp.state = state;
  if (comp.node) {
    // A memo may change: everything downstream needs to check it first.
    for (const observer of comp.node.observers) mark(observer, Pending);
  } else if (wasClean) {
    queue.push(comp);
  }
}

/** Marks every observer of `node` dirty and flushes effects (batched). */
export function notifyObservers<T>(node: SignalNode<T>): void {
  if (node.observers.size === 0) return;
  batchDepth++;
  try {
    for (const observer of node.observers) mark(observer, Dirty);
  } finally {
    endBatch();
  }
}

/**
 * Brings a computation up to date: a Pending one first refreshes the memos it
 * reads and only re-runs if one of them actually changed.
 */
export function updateIfNecessary(comp: Computation): void {
  if (comp.state === Pending) {
    for (const source of comp.sources) {
      if (source.comp) {
        updateIfNecessary(source.comp);
        if ((comp.state as ComputationState) === Dirty) break;
      }
    }
  }
  if (comp.state === Dirty) runComputation(comp);
  else comp.state = Clean;
}

export function cleanupComputation(comp: Computation): void {
  disposeChildren(comp);
  runCleanups(comp);
  unsubscribe(comp);
}

export function runComputation(comp: Computation): void {
  if (comp.disposed || !comp.fn) return;
  cleanupComputation(comp);

  const prevObserver = setCurrentObserver(comp);
  const prevOwner = setCurrentOwner(comp);
  comp.state = Clean;
  // Writes made while running are flushed after this computation finishes,
  // never by re-entering it mid-run.
  batchDepth++;
  try {
    let next: unknown;
    try {
      next = comp.fn(comp.value);
    } catch (err) {
      handleError(err, comp);
      return;
    }
    const node = comp.node;
    if (node) {
      if (node.equals === false || !node.equals(node.value, next)) {
        node.value = next;
        comp.value = next;
        batchDepth++;
        try {
          for (const observer of node.observers) mark(observer, Dirty);
        } finally {
          endBatch();
        }
      }
    } else {
      comp.value = next;
    }
  } finally {
    setCurrentObserver(prevObserver);
    setCurrentOwner(prevOwner);
    endBatch();
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Runs `fn` in a new owner; errors thrown by it, or later by any computation
 * created inside it, go to `handler` instead of propagating.
 */
export function catchError<T>(fn: () => T, handler: (error: unknown) => void): T | undefined {
  const owner = createOwner();
  owner.context[ERROR_HANDLER] = handler;
  const prevOwner = setCurrentOwner(owner);
  try {
    return fn();
  } catch (err) {
    handler(err);
    return undefined;
  } finally {
    setCurrentOwner(prevOwner);
  }
}

/** Sends `error` to the nearest `catchError` handler above `owner`, or rethrows. */
export function handleError(error: unknown, owner: Owner | null): void {
  for (let o = owner; o; o = o.parent) {
    const handler = o.context[ERROR_HANDLER] as ((e: unknown) => void) | undefined;
    if (handler) {
      handler(error);
      return;
    }
  }
  throw error;
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export function scheduleEffect(comp: Computation): void {
  mark(comp, Dirty);
  if (batchDepth === 0) flushEffects();
}

export function flushEffects(): void {
  if (flushing) return;
  flushing = true;
  let error: unknown = null;
  let iterations = 0;
  try {
    while (queue.length > 0) {
      if (++iterations > MAX_FLUSH_ITERATIONS) {
        queue.length = 0;
        throw new Error('[Veloz] Possible infinite loop: effects kept re-triggering each other.');
      }
      const comp = queue.shift()!;
      if (comp.disposed || comp.state === Clean) continue;
      try {
        updateIfNecessary(comp);
      } catch (err) {
        // Keep running the remaining effects; report the first error after.
        error ??= err;
      }
    }
  } finally {
    flushing = false;
  }
  if (error) throw error;
}

export function startBatch(): void {
  batchDepth++;
}

export function endBatch(): void {
  if (--batchDepth === 0) flushEffects();
}

export function getBatchDepth(): number {
  return batchDepth;
}

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

export function validateKey(key: string | symbol): boolean {
  if (typeof key === 'string' && FORBIDDEN_KEYS.has(key)) {
    if (typeof console !== 'undefined') {
      console.warn(`[Veloz Security] Blocked prototype pollution attempt via key "${key}"`);
    }
    return false;
  }
  return true;
}
