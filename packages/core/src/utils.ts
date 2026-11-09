/** A value, or a function that returns it (read reactively). */
export type MaybeAccessor<T> = T | (() => T);

/** Calls `value` if it is a function, otherwise returns it. */
export function access<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}
