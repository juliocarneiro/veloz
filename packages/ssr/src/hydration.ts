let counter = 0;

export function nextHydrationId(): string {
  return String(counter++);
}

/** Restarts hydration keys at 0; returns the previous position. */
export function resetHydrationCounter(): number {
  const previous = counter;
  counter = 0;
  return previous;
}

/** Restores a position saved by `resetHydrationCounter` (nested renders). */
export function restoreHydrationCounter(position: number): void {
  counter = position;
}
