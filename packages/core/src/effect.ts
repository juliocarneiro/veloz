import type { Computation } from './types.js';
import { ComputationState } from './types.js';
import {
  createOwner,
  setCurrentObserver,
  setCurrentOwner,
  cleanupComputation,
  incrementClock,
} from './reactive.js';

export function createEffect<T>(fn: (prev?: T) => T): void {
  const comp: Computation = {
    ...createOwner(),
    fn: fn as (prev?: unknown) => unknown,
    sources: [],
    sourceSlots: [],
    state: ComputationState.Dirty,
    updatedAt: 0,
  };

  runEffect(comp);
}

function runEffect(comp: Computation): void {
  const prevObserver = setCurrentObserver(comp);
  const prevOwner = setCurrentOwner(comp);
  cleanupComputation(comp);

  comp.state = ComputationState.Clean;
  comp.updatedAt = incrementClock();

  try {
    comp.fn!(undefined);
  } finally {
    setCurrentObserver(prevObserver);
    setCurrentOwner(prevOwner);
  }
}

export function createRenderEffect<T>(fn: (prev?: T) => T): void {
  const comp: Computation = {
    ...createOwner(),
    fn: null,
    sources: [],
    sourceSlots: [],
    state: ComputationState.Dirty,
    updatedAt: 0,
  };

  comp.fn = () => {
    cleanupComputation(comp);
    const prevObserver = setCurrentObserver(comp);
    const prevOwner = setCurrentOwner(comp);
    comp.state = ComputationState.Clean;
    comp.updatedAt = incrementClock();
    try {
      fn(undefined);
    } finally {
      setCurrentObserver(prevObserver);
      setCurrentOwner(prevOwner);
    }
    return undefined;
  };

  const prevObserver = setCurrentObserver(comp);
  const prevOwner = setCurrentOwner(comp);
  comp.state = ComputationState.Clean;
  comp.updatedAt = incrementClock();

  try {
    fn(undefined);
  } finally {
    setCurrentObserver(prevObserver);
    setCurrentOwner(prevOwner);
  }
}

export function createComputation(fn: () => void): Computation {
  const comp: Computation = {
    ...createOwner(),
    fn,
    sources: [],
    sourceSlots: [],
    state: ComputationState.Dirty,
    updatedAt: 0,
  };
  return comp;
}
