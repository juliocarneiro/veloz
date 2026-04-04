import {
  createOwner,
  setCurrentOwner,
} from '@veloz/core';
import { escapeHTML, escapeAttr } from './escape.js';
import { nextHydrationId } from './hydration.js';
import { processCssProp } from './css-prop.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript):/i;
const URL_ATTRIBUTES = new Set([
  'href', 'src', 'action', 'formaction', 'poster', 'srcset',
  'background', 'cite', 'codebase', 'longdesc',
]);

const RAW_HTML = Symbol('veloz_raw_html');

interface RawHTML {
  [RAW_HTML]: true;
  value: string;
}

function rawHTML(value: string): RawHTML {
  return { [RAW_HTML]: true, value };
}

function isRawHTML(value: unknown): value is RawHTML {
  return value != null && typeof value === 'object' && RAW_HTML in value;
}

export function jsx(
  tag: string | Function,
  props: Record<string, unknown> | null
): RawHTML {
  if (!props) props = {};

  if (typeof tag === 'function') {
    return rawHTML(renderComponent(tag, props));
  }

  return rawHTML(renderElement(tag, props));
}

export { jsx as jsxs, jsx as jsxDEV };

export function Fragment(props: { children?: unknown }): RawHTML {
  if (props.children == null) return rawHTML('');
  return rawHTML(renderChildren(props.children));
}

function renderComponent(
  comp: Function,
  props: Record<string, unknown>
): string {
  const owner = createOwner();
  const prevOwner = setCurrentOwner(owner);

  const componentProps: Record<string, unknown> = Object.create(null);

  const { children, ...restProps } = props;

  for (const key of Object.keys(restProps)) {
    const value = restProps[key];
    if (typeof value === 'function' && !key.startsWith('on') && key !== 'ref') {
      Object.defineProperty(componentProps, key, {
        get: value as () => unknown,
        enumerable: true,
        configurable: true,
      });
    } else {
      componentProps[key] = value;
    }
  }

  if (children != null) {
    componentProps.children = children;
  }

  try {
    const result = comp(componentProps);
    return resolveToString(result);
  } finally {
    setCurrentOwner(prevOwner);
  }
}

function renderElement(
  tag: string,
  props: Record<string, unknown>
): string {
  const hk = nextHydrationId();
  let html = `<${tag} data-hk="${hk}"`;

  const { children, ...restProps } = props;

  let classValue = '';

  if (restProps.css) {
    const cssClass = processCssProp(restProps.css as Record<string, unknown>);
    classValue = cssClass;
  }

  for (const key of Object.keys(restProps)) {
    if (key === 'css' || key === 'ref') continue;
    if (key.startsWith('on')) continue;

    const raw = restProps[key];
    const resolved = typeof raw === 'function' ? (raw as () => unknown)() : raw;

    if (key === 'class' || key === 'className') {
      const cls = resolveClass(resolved);
      classValue = classValue ? `${classValue} ${cls}` : cls;
      continue;
    }

    if (key === 'classList') {
      const cls = resolveClassList(resolved as Record<string, boolean>);
      if (cls) {
        classValue = classValue ? `${classValue} ${cls}` : cls;
      }
      continue;
    }

    if (key === 'style') {
      const s = resolveStyle(resolved);
      if (s) html += ` style="${escapeAttr(s)}"`;
      continue;
    }

    if (key === 'innerHTML' || key === 'innerText' || key === 'textContent') {
      continue;
    }

    if (resolved == null || resolved === false) continue;

    if (URL_ATTRIBUTES.has(key.toLowerCase()) && typeof resolved === 'string') {
      if (DANGEROUS_URL_SCHEMES.test(resolved.trim())) continue;
    }

    if (resolved === true) {
      html += ` ${key}`;
    } else {
      html += ` ${key}="${escapeAttr(String(resolved))}"`;
    }
  }

  if (classValue) {
    html += ` class="${escapeAttr(classValue)}"`;
  }

  html += '>';

  if (VOID_ELEMENTS.has(tag)) {
    return html;
  }

  if (restProps.innerHTML != null) {
    html += String(restProps.innerHTML);
  } else if (restProps.textContent != null) {
    html += escapeHTML(String(restProps.textContent));
  } else {
    html += renderChildren(children);
  }

  html += `</${tag}>`;
  return html;
}

export function renderChildren(children: unknown): string {
  if (children == null || typeof children === 'boolean') return '';

  if (isRawHTML(children)) return children.value;

  if (typeof children === 'string') return escapeHTML(children);
  if (typeof children === 'number') return String(children);

  if (Array.isArray(children)) {
    let result = '';
    for (const child of children) {
      result += renderChildren(child);
    }
    return result;
  }

  if (typeof children === 'function') {
    const value = (children as () => unknown)();
    return renderChildren(value);
  }

  return escapeHTML(String(children));
}

function resolveToString(value: unknown): string {
  if (isRawHTML(value)) return value.value;
  if (typeof value === 'string') return value;
  if (value == null || typeof value === 'boolean') return '';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(resolveToString).join('');
  if (typeof value === 'function') return resolveToString((value as () => unknown)());
  return String(value);
}

function resolveClass(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  }
  return '';
}

function resolveClassList(value: Record<string, boolean> | null | undefined): string {
  if (!value) return '';
  return Object.entries(value)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(' ');
}

function resolveStyle(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const styles = value as Record<string, string>;
    return Object.keys(styles)
      .map((prop) => {
        const cssKey = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        return `${cssKey}:${styles[prop]}`;
      })
      .join(';');
  }
  return '';
}
