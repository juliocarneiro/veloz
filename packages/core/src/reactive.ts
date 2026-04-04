import type { Owner, Computation, SignalNode } from './types.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

let currentObserver: Computation | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let pendingEffects: Computation[] = [];
let clock = 0;

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

export function getClock(): number {
  return clock;
}

export function incrementClock(): number {
  return ++clock;
}

export function createOwner(): Owner {
  const owner: Owner = {
    parent: currentOwner,
    children: [],
    cleanups: [],
    context: Object.create(null),
  };
  if (currentOwner) {
    currentOwner.children.push(owner);
  }
  return owner;
}

export function disposeOwner(owner: Owner): void {
  for (let i = owner.children.length - 1; i >= 0; i--) {
    disposeOwner(owner.children[i]);
  }
  owner.children.length = 0;

  for (let i = owner.cleanups.length - 1; i >= 0; i--) {
    owner.cleanups[i]();
  }
  owner.cleanups.length = 0;

  if (owner.parent) {
    const idx = owner.parent.children.indexOf(owner);
    if (idx !== -1) owner.parent.children.splice(idx, 1);
  }
  owner.parent = null;
}

export function runWithOwner<T>(owner: Owner, fn: () => T): T {
  const prevOwner = setCurrentOwner(owner);
  try {
    return fn();
  } finally {
    setCurrentOwner(prevOwner);
  }
}

export function trackRead<T>(signal: SignalNode<T>): void {
  if (currentObserver === null) return;

  const observer = currentObserver;
  const sourceSlot = signal.observers.length;
  const observerSlot = observer.sources.length;

  signal.observers.push(observer);
  signal.observerSlots.push(observerSlot);
  observer.sources.push(signal as SignalNode<unknown>);
  observer.sourceSlots.push(sourceSlot);
}

export function notifyObservers<T>(signal: SignalNode<T>): void {
  const snapshot = signal.observers.slice();
  for (let i = 0; i < snapshot.length; i++) {
    const comp = snapshot[i];
    if (comp.state === 0 /* Clean */) {
      comp.state = 1 /* Dirty */;
      scheduleEffect(comp);
    }
  }
}

export function cleanupComputation(comp: Computation): void {
  for (let i = comp.cleanups.length - 1; i >= 0; i--) {
    comp.cleanups[i]();
  }
  comp.cleanups.length = 0;

  for (let i = comp.children.length - 1; i >= 0; i--) {
    disposeOwner(comp.children[i]);
  }
  comp.children.length = 0;

  removeSourceObservers(comp);
}

function removeSourceObservers(comp: Computation): void {
  for (let i = 0; i < comp.sources.length; i++) {
    const source = comp.sources[i];
    const slot = comp.sourceSlots[i];
    const lastObserver = source.observers[source.observers.length - 1];

    if (lastObserver) {
      source.observers[slot] = lastObserver;
      source.observerSlots[slot] = lastObserver.sources.indexOf(source);
      const lastSlotIdx = source.observers.length - 1;
      if (slot !== lastSlotIdx) {
        const lastObs = source.observers[slot];
        const srcIdx = lastObs.sourceSlots.findIndex(
          (s, idx) => s === lastSlotIdx && lastObs.sources[idx] === source
        );
        if (srcIdx !== -1) lastObs.sourceSlots[srcIdx] = slot;
      }
    }

    source.observers.pop();
    source.observerSlots.pop();
  }
  comp.sources.length = 0;
  comp.sourceSlots.length = 0;
}

export function scheduleEffect(comp: Computation): void {
  pendingEffects.push(comp);

  if (batchDepth === 0) {
    flushEffects();
  }
}

export function flushEffects(): void {
  while (pendingEffects.length > 0) {
    const effects = pendingEffects.slice();
    pendingEffects.length = 0;

    for (let i = 0; i < effects.length; i++) {
      const comp = effects[i];
      if (comp.state !== 0 /* Clean */ && comp.fn) {
        runComputation(comp);
      }
    }
  }
}

export function runComputation(comp: Computation): void {
  const prevObserver = setCurrentObserver(comp);
  const prevOwner = setCurrentOwner(comp);
  cleanupComputation(comp);

  comp.state = 0 /* Clean */;
  comp.updatedAt = incrementClock();

  try {
    comp.fn!(undefined);
  } finally {
    setCurrentObserver(prevObserver);
    setCurrentOwner(prevOwner);
  }
}

export function startBatch(): void {
  batchDepth++;
}

export function endBatch(): void {
  if (--batchDepth === 0) {
    flushEffects();
  }
}

export function getBatchDepth(): number {
  return batchDepth;
}

export function validateKey(key: string | symbol): boolean {
  if (typeof key === 'string' && FORBIDDEN_KEYS.has(key)) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[Veloz Security] Blocked prototype pollution attempt via key "${key}"`
      );
    }
    return false;
  }
  return true;
}
