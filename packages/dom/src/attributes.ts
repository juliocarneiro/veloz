import { createEffect } from '@veloz/core';
import { validateAttribute, sanitizeURL } from './security.js';
import { setEventHandler, isDelegatedEvent } from './events.js';
import { sanitize } from './sanitizer.js';

const URL_ATTRIBUTES = new Set([
  'href', 'src', 'action', 'formaction', 'poster', 'srcset',
]);

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function applyProp(
  el: HTMLElement,
  name: string,
  value: unknown,
  isSVG = false
): void {
  if (name === 'ref') {
    if (typeof value === 'function') {
      (value as (el: HTMLElement) => void)(el);
    }
    return;
  }

  if (name === 'innerHTML') {
    if (typeof value === 'string') {
      el.innerHTML = sanitize(value);
    }
    return;
  }

  if (name === 'style') {
    applyStyle(el, value);
    return;
  }

  if (name === 'class' || name === 'className') {
    applyClass(el, value);
    return;
  }

  if (name === 'classList') {
    applyClassList(el, value as Record<string, boolean>);
    return;
  }

  if (name.startsWith('on')) {
    const eventName = name.slice(2).toLowerCase();
    if (typeof value === 'function') {
      if (isDelegatedEvent(eventName)) {
        setEventHandler(el, eventName, value as EventListener);
      } else {
        el.addEventListener(eventName, value as EventListener);
      }
    }
    return;
  }

  if (!validateAttribute(name, value)) return;

  if (URL_ATTRIBUTES.has(name) && typeof value === 'string') {
    value = sanitizeURL(value);
  }

  if (isSVG) {
    if (value == null || value === false) {
      el.removeAttribute(name);
    } else {
      el.setAttribute(name, String(value));
    }
  } else if (name in el && !isSVG) {
    try {
      (el as any)[name] = value;
    } catch {
      el.setAttribute(name, String(value));
    }
  } else if (value == null || value === false) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value === true ? '' : String(value));
  }
}

export function applyReactiveProp(
  el: HTMLElement,
  name: string,
  getter: () => unknown,
  isSVG = false
): void {
  createEffect(() => {
    applyProp(el, name, getter(), isSVG);
  });
}

function applyStyle(
  el: HTMLElement,
  value: unknown
): void {
  if (typeof value === 'string') {
    el.style.cssText = value;
  } else if (value && typeof value === 'object') {
    const styles = value as Record<string, string>;
    for (const prop of Object.keys(styles)) {
      const cssKey = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      el.style.setProperty(cssKey, styles[prop]);
    }
  } else {
    el.removeAttribute('style');
  }
}

function applyClass(el: HTMLElement, value: unknown): void {
  if (typeof value === 'string') {
    el.className = value;
  } else if (Array.isArray(value)) {
    el.className = value.filter(Boolean).join(' ');
  } else if (value && typeof value === 'object') {
    el.className = Object.entries(value as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  } else {
    el.className = '';
  }
}

function applyClassList(
  el: HTMLElement,
  classes: Record<string, boolean>
): void {
  for (const [name, active] of Object.entries(classes)) {
    el.classList.toggle(name, !!active);
  }
}
