import { createRenderEffect, isValidAttributeName } from '@velozjs/core';
import { validateAttribute } from './security.js';
import { setEventHandler } from './events.js';
import { sanitize } from './sanitizer.js';

type Ref<T> = ((el: T) => void) | { current: T | null };

const prevStyles = new WeakMap<Element, Set<string>>();

/** Event prop name → DOM event name: `onClick` → `click`, `onMouseEnter` → `mouseenter`. */
export function eventNameFromProp(name: string): string | null {
  if (name.length < 3 || !name.startsWith('on')) return null;
  return name.slice(2).toLowerCase();
}

export function applyProp(el: Element, name: string, value: unknown, isSVG = false): void {
  if (name === 'ref') {
    setRef(el, value as Ref<Element> | null | undefined);
    return;
  }

  if (name === 'innerHTML') {
    el.innerHTML = typeof value === 'string' ? sanitize(value) : '';
    return;
  }

  if (name === 'style') {
    applyStyle(el as HTMLElement, value);
    return;
  }

  if (name === 'class' || name === 'className') {
    applyClass(el, value);
    return;
  }

  if (name === 'classList') {
    applyClassList(el, value as Record<string, boolean> | null);
    return;
  }

  const eventName = eventNameFromProp(name);
  if (eventName && (typeof value === 'function' || value == null)) {
    setEventHandler(el, eventName, (value as EventListener) ?? null);
    return;
  }

  if (!validateAttribute(name, value)) {
    // Never leave a previous (safe) value next to a rejected one.
    if (isValidAttributeName(name)) el.removeAttribute(name);
    return;
  }

  setAttributeOrProperty(el, name, value, isSVG);
}

function setAttributeOrProperty(el: Element, name: string, value: unknown, isSVG: boolean): void {
  const isAria = name.startsWith('aria-');
  if (isSVG || isAria || name.startsWith('data-') || !(name in el)) {
    if (value == null || (value === false && !isAria)) {
      el.removeAttribute(name);
    } else {
      el.setAttribute(name, value === true && !isAria ? '' : String(value));
    }
    return;
  }

  // DOM property (value, checked, disabled, textContent...).
  const current = (el as unknown as Record<string, unknown>)[name];
  if (value == null) {
    if (typeof current === 'boolean') (el as unknown as Record<string, unknown>)[name] = false;
    else if (name === 'value' || name === 'textContent') (el as unknown as Record<string, unknown>)[name] = '';
    else el.removeAttribute(name);
    return;
  }
  try {
    (el as unknown as Record<string, unknown>)[name] = value;
  } catch {
    el.setAttribute(name, String(value));
  }
}

export function applyReactiveProp(el: Element, name: string, getter: () => unknown, isSVG = false): void {
  createRenderEffect(() => {
    applyProp(el, name, getter(), isSVG);
  });
}

function setRef<T>(el: T, ref: Ref<T> | null | undefined): void {
  if (typeof ref === 'function') ref(el);
  else if (ref && typeof ref === 'object') ref.current = el;
}

function toKebab(prop: string): string {
  return prop.startsWith('--') ? prop : prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function applyStyle(el: HTMLElement, value: unknown): void {
  const previous = prevStyles.get(el);
  if (typeof value === 'string') {
    el.style.cssText = value;
    prevStyles.delete(el);
    return;
  }
  if (value && typeof value === 'object') {
    const next = new Set<string>();
    for (const [prop, v] of Object.entries(value as Record<string, unknown>)) {
      const key = toKebab(prop);
      if (v == null || v === false) continue;
      el.style.setProperty(key, String(v));
      next.add(key);
    }
    // Remove properties that were set last time but are gone now.
    if (previous) for (const key of previous) if (!next.has(key)) el.style.removeProperty(key);
    prevStyles.set(el, next);
    return;
  }
  el.removeAttribute('style');
  prevStyles.delete(el);
}

function classString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(classString).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  }
  return '';
}

function applyClass(el: Element, value: unknown): void {
  const cls = classString(value);
  if (cls) el.setAttribute('class', cls);
  else el.removeAttribute('class');
}

function applyClassList(el: Element, classes: Record<string, boolean> | null): void {
  if (!classes) return;
  for (const [name, active] of Object.entries(classes)) {
    for (const token of name.split(/\s+/).filter(Boolean)) el.classList.toggle(token, !!active);
  }
}
