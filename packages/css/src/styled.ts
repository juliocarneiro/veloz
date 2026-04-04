import { createEffect } from '@veloz/core';
import { hash } from './hash.js';
import { insertCSS, hasStyle } from './sheet.js';

type StyledTag = keyof HTMLElementTagNameMap;

interface StyledComponent {
  (props: Record<string, unknown>): HTMLElement;
  __veloz_styled: true;
}

function evaluateTemplate(
  strings: TemplateStringsArray,
  values: unknown[],
  props: Record<string, unknown>
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      result += typeof v === 'function' ? String(v(props)) : String(v ?? '');
    }
  }
  return result;
}

function scopeCSS(cssText: string, className: string): string {
  const selector = '.' + className;
  const trimmed = cssText.trim();
  if (!trimmed) return '';

  const lines = trimmed.split('\n');
  let result = '';
  let hasTopLevel = false;
  let topLevel = '';
  let buffer = '';
  let depth = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{') depth++;
      if (line[i] === '}') depth--;
    }

    if (depth === 0 && buffer === '' && !line.includes('{')) {
      topLevel += line + '\n';
      hasTopLevel = true;
      continue;
    }

    buffer += line + '\n';

    if (depth === 0 && buffer.trim()) {
      const block = buffer.trim();
      result += block.replace(/&/g, selector) + '\n';
      buffer = '';
    }
  }

  if (buffer.trim()) {
    result += buffer.trim().replace(/&/g, selector) + '\n';
  }

  if (hasTopLevel) {
    result = `${selector}{${topLevel.trim()}}` + '\n' + result;
  }

  return result.trim();
}

function appendChildren(el: HTMLElement, children: unknown): void {
  if (children == null || typeof children === 'boolean') return;

  if (typeof children === 'string' || typeof children === 'number') {
    el.appendChild(document.createTextNode(String(children)));
    return;
  }

  if (children instanceof Node) {
    el.appendChild(children);
    return;
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      appendChildren(el, child);
    }
    return;
  }

  if (typeof children === 'function') {
    const marker = document.createTextNode('');
    el.appendChild(marker);
    createEffect(() => {
      const value = (children as () => unknown)();
      if (value != null && typeof value !== 'boolean') {
        marker.textContent = String(value);
      } else {
        marker.textContent = '';
      }
    });
    return;
  }
}

export function styled(tag: StyledTag) {
  return function styledTemplate(
    strings: TemplateStringsArray,
    ...templateValues: unknown[]
  ): StyledComponent {
    const hasDynamic = templateValues.some(v => typeof v === 'function');

    let staticClassName: string | null = null;
    if (!hasDynamic) {
      const raw = evaluateTemplate(strings, templateValues, {});
      staticClassName = hash(raw);
      const scoped = scopeCSS(raw, staticClassName);
      if (scoped) insertCSS(staticClassName, scoped);
    }

    const component = function (props: Record<string, unknown>): HTMLElement {
      const el = document.createElement(tag);

      let className: string;
      if (staticClassName) {
        className = staticClassName;
      } else {
        const raw = evaluateTemplate(strings, templateValues, props);
        className = hash(raw);
        if (!hasStyle(className)) {
          const scoped = scopeCSS(raw, className);
          if (scoped) insertCSS(className, scoped);
        }
      }

      el.className = props.class
        ? `${className} ${props.class}`
        : className;

      for (const key of Object.keys(props)) {
        if (key === 'class' || key === 'className' || key === 'children') continue;
        if (key === 'ref') {
          if (typeof props[key] === 'function') {
            (props[key] as (el: HTMLElement) => void)(el);
          }
          continue;
        }
        if (key.startsWith('on') && typeof props[key] === 'function') {
          const event = key.slice(2).toLowerCase();
          el.addEventListener(event, props[key] as EventListener);
          continue;
        }
        el.setAttribute(key, String(props[key]));
      }

      if (props.children != null) {
        appendChildren(el, props.children);
      }

      return el;
    } as StyledComponent;

    component.__veloz_styled = true;
    return component;
  };
}
