import { createMemo, access, type MaybeAccessor } from '@velozjs/core';
import type { VelozNode } from '../types.js';

const MATCH = Symbol.for('veloz.match');

export interface MatchProps<T> {
  when: MaybeAccessor<T | undefined | null | false>;
  children?: unknown | ((value: NonNullable<T>) => VelozNode);
}

interface MatchDescriptor {
  [MATCH]: true;
  props: MatchProps<unknown>;
}

/** A branch of `<Switch>`. Renders nothing on its own. */
export function Match<T>(props: MatchProps<T>): any {
  return { [MATCH]: true, props } satisfies MatchDescriptor;
}

export interface SwitchProps {
  fallback?: unknown;
  children?: unknown;
}

function isMatch(value: unknown): value is MatchDescriptor {
  return value != null && typeof value === 'object' && MATCH in value;
}

function collectMatches(children: unknown, out: MatchDescriptor[]): MatchDescriptor[] {
  if (Array.isArray(children)) for (const c of children) collectMatches(c, out);
  else if (isMatch(children)) out.push(children);
  return out;
}

/** Renders the first `<Match>` whose `when` is truthy, or `fallback`. */
export function Switch(props: SwitchProps): () => unknown {
  const matches = collectMatches(props.children, []);

  const selected = createMemo<{ index: number; value: unknown } | null>(
    () => {
      for (let i = 0; i < matches.length; i++) {
        const value = access(matches[i].props.when);
        if (value) return { index: i, value };
      }
      return null;
    },
    undefined,
    {
      equals: (a, b) => {
        if (!a || !b) return a === b;
        if (a.index !== b.index) return false;
        return typeof matches[a.index].props.children === 'function' ? a.value === b.value : true;
      },
    }
  );

  return () => {
    const s = selected();
    if (!s) return props.fallback ?? null;
    const children = matches[s.index].props.children;
    return typeof children === 'function' ? (children as (v: unknown) => unknown)(s.value) : children;
  };
}
