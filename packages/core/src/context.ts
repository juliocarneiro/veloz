import type { Context } from './types.js';
import { getCurrentOwner } from './reactive.js';

export function createContext<T>(defaultValue?: T): Context<T> {
  const id = Symbol('context');
  const context: Context<T> = {
    id,
    defaultValue,
    Provider: (props: { value: T; children?: unknown }) => {
      const owner = getCurrentOwner();
      if (owner) {
        owner.context[id] = props.value;
      }
      return props.children;
    },
  };
  return context;
}

export function useContext<T>(context: Context<T>): T {
  let owner = getCurrentOwner();
  while (owner) {
    if (context.id in owner.context) {
      return owner.context[context.id] as T;
    }
    owner = owner.parent;
  }
  if (context.defaultValue !== undefined) {
    return context.defaultValue;
  }
  throw new Error(
    `[Veloz] useContext: context not found. Wrap your component tree in a Provider.`
  );
}
