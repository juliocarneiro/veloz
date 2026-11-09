import { access } from '@velozjs/core';
import { createElement } from '@velozjs/dom';
import { hash } from './hash.js';
import { insertCSS, hasStyle } from './sheet.js';
import { scopeCSS } from './css.js';

type StyledTag = keyof HTMLElementTagNameMap | (string & {});
type Value = string | number | null | undefined | false;
type Interpolation<P> = Value | ((props: P) => Value);

export interface StyledComponent<P = Record<string, unknown>> {
  (props: P & Record<string, unknown>): any;
  __veloz_styled: true;
}

type ElementFactory = (tag: string, props: Record<string, unknown>) => unknown;

// Elements are created through the active JSX runtime: the DOM one by
// default, the string one once @velozjs/ssr is loaded on the server.
let factory: ElementFactory = (tag, props) => createElement(tag, props);

/** Used by @velozjs/ssr to render styled components as HTML strings. */
export function setElementFactory(fn: ElementFactory): void {
  factory = fn;
}

function evaluate<P>(strings: TemplateStringsArray, values: Interpolation<P>[], props: P): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      const resolved = typeof v === 'function' ? v(props) : v;
      result += resolved == null || resolved === false ? '' : String(resolved);
    }
  }
  return result;
}

function classFor(raw: string): string {
  const className = hash(raw);
  if (!hasStyle(className)) {
    const scoped = scopeCSS(raw, className);
    if (scoped) insertCSS(className, scoped);
  }
  return className;
}

function joinClass(base: string, extra: unknown): string {
  const e = access(extra as string | (() => string));
  return e ? `${base} ${e}` : base;
}

/**
 * Styled components: styled('button')`...`. Function interpolations receive
 * the props; when they read accessors, the class updates reactively.
 */
export function styled(tag: StyledTag) {
  return function styledTemplate<P = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: Interpolation<P>[]
  ): StyledComponent<P> {
    const dynamic = values.some((v) => typeof v === 'function');
    const staticClass = dynamic ? '' : classFor(evaluate(strings, values, {} as P));

    const component = ((props: P & Record<string, unknown>) => {
      const rest: Record<string, unknown> = {};
      for (const key of Object.keys(props)) {
        if (key === 'class' || key === 'className') continue;
        Object.defineProperty(rest, key, Object.getOwnPropertyDescriptor(props, key)!);
      }
      const extra = props.class ?? props.className;
      const base = () => staticClass || classFor(evaluate(strings, values, props));
      rest.class =
        dynamic || typeof extra === 'function' ? () => joinClass(base(), extra) : joinClass(staticClass, extra);
      return factory(tag, rest);
    }) as StyledComponent<P>;

    component.__veloz_styled = true;
    return component;
  };
}
