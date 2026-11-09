import {
  createOwner,
  setCurrentOwner,
  runWithOwner,
  untrack,
  type Owner,
  URL_ATTRIBUTES,
  isSafeAttributeURL,
  isValidAttributeName,
  isValidTagName,
} from '@velozjs/core';
import { processCssProp } from '@velozjs/css';
import { escapeHTML, escapeAttr } from './escape.js';
import { nextHydrationId } from './hydration.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** JSX prop names that differ from the HTML attribute name. */
const ATTRIBUTE_ALIASES: Record<string, string> = { htmlFor: 'for', className: 'class' };

/**
 * Markers around every dynamic region (a function child, or a component that
 * returns a function on the client). `hydrate()` matches them in order.
 */
export const REGION_START = '<!--[-->';
export const REGION_END = '<!--]-->';

const RAW_HTML = Symbol('veloz_raw_html');
const DEFERRED = Symbol('veloz_deferred');
const MATCH = Symbol.for('veloz.match');

/**
 * A component's result, resolved when its parent renders it. The client
 * evaluates functions returned by components at insertion time; doing the
 * same here keeps hydration keys in the same order on both sides.
 */
interface Deferred {
  [DEFERRED]: true;
  value: unknown;
  owner: Owner;
}

function isDeferred(value: unknown): value is Deferred {
  return value != null && typeof value === 'object' && DEFERRED in value;
}

export interface RawHTML {
  [RAW_HTML]: true;
  value: string;
}

export function rawHTML(value: string): RawHTML {
  return { [RAW_HTML]: true, value };
}

export function isRawHTML(value: unknown): value is RawHTML {
  return value != null && typeof value === 'object' && RAW_HTML in value;
}

export function region(html: string): RawHTML {
  return rawHTML(REGION_START + html + REGION_END);
}

export function jsx(tag: string | Function, props: Record<string, unknown> | null): any {
  props ??= {};
  if (typeof tag === 'function') return renderComponent(tag, props);
  return rawHTML(renderElement(tag, props));
}

export { jsx as jsxs, jsx as jsxDEV };

/** Same as the client: children are passed through untouched. */
export function Fragment(props: { children?: unknown }): RawHTML {
  return rawHTML(renderChildren(props.children));
}

function renderComponent(comp: Function, props: Record<string, unknown>): unknown {
  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);
  try {
    const result = untrack(() => comp(props));
    // <Match> descriptors are read by <Switch>; pass them through.
    if (result != null && typeof result === 'object' && MATCH in result) return result;
    if (isRawHTML(result) || typeof result === 'string' || result == null) return result;
    return { [DEFERRED]: true, value: result, owner } satisfies Deferred;
  } finally {
    setCurrentOwner(prevOwner);
  }
}

let warnedInnerHTML = false;

function renderElement(tag: string, props: Record<string, unknown>): string {
  if (!isValidTagName(tag)) throw new Error(`[Veloz SSR] Invalid tag name "${tag}".`);

  const hk = nextHydrationId();
  let html = `<${tag} data-hk="${hk}"`;
  let classValue = props.css ? processCssProp(props.css as Record<string, unknown>) : '';
  let content: string | null = null;

  for (const key of Object.keys(props)) {
    if (key === 'children' || key === 'css' || key === 'ref' || key === 'key') continue;
    if (key.length > 2 && key.startsWith('on')) continue; // event handlers are client-only

    const raw = props[key];
    const value = typeof raw === 'function' ? (raw as () => unknown)() : raw;

    if (key === 'class' || key === 'className') {
      const cls = resolveClass(value);
      if (cls) classValue = classValue ? `${cls} ${classValue}` : cls;
      continue;
    }
    if (key === 'classList') {
      const cls = resolveClass(value);
      if (cls) classValue = classValue ? `${classValue} ${cls}` : cls;
      continue;
    }
    if (key === 'style') {
      const s = resolveStyle(value);
      if (s) html += ` style="${escapeAttr(s)}"`;
      continue;
    }
    if (key === 'innerHTML') {
      // There is no DOM sanitizer on the server; the client sets it (sanitized).
      if (value != null && !warnedInnerHTML && isDev()) {
        warnedInnerHTML = true;
        console.warn('[Veloz SSR] innerHTML is not rendered on the server; it is set (sanitized) on the client.');
      }
      continue;
    }
    if (key === 'textContent' || key === 'innerText') {
      content = value == null ? '' : escapeHTML(String(value));
      continue;
    }
    if (key === 'value' && tag === 'textarea') {
      content = value == null ? '' : escapeHTML(String(value));
      continue;
    }

    const name = ATTRIBUTE_ALIASES[key] ?? key;
    if (!isValidAttributeName(name)) continue;
    const isAria = name.startsWith('aria-');
    if (value == null || (value === false && !isAria)) continue;
    if (URL_ATTRIBUTES.has(name.toLowerCase()) && !isSafeAttributeURL(name, String(value))) continue;

    html += value === true && !isAria ? ` ${name}` : ` ${name}="${escapeAttr(String(value))}"`;
  }

  if (classValue) html += ` class="${escapeAttr(classValue)}"`;
  html += '>';

  if (VOID_ELEMENTS.has(tag.toLowerCase())) return html;

  html += content ?? (props.innerHTML != null ? '' : renderChildren(props.children));
  return html + `</${tag}>`;
}

export function renderChildren(children: unknown): string {
  if (children == null || typeof children === 'boolean') return '';
  if (isRawHTML(children)) return children.value;
  if (isDeferred(children)) {
    const { value, owner } = children;
    return runWithOwner(owner, () => untrack(() => renderChildren(value)));
  }
  if (typeof children === 'string') return escapeHTML(children);
  if (typeof children === 'number') return String(children);

  if (Array.isArray(children)) {
    let result = '';
    for (const child of children) result += renderChildren(child);
    return result;
  }

  if (typeof children === 'function') {
    return REGION_START + renderChildren((children as () => unknown)()) + REGION_END;
  }

  if (typeof children === 'object' && MATCH in children) return '';
  return escapeHTML(String(children));
}

function resolveClass(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(resolveClass).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  }
  return '';
}

function resolveStyle(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== false)
      .map(([prop, v]) => {
        const key = prop.startsWith('--') ? prop : prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        return `${key}:${v}`;
      })
      .join(';');
  }
  return '';
}

function isDev(): boolean {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.NODE_ENV !== 'production';
}
