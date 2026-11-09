import { toCSSProperty, toCSSValue } from '@velozjs/core';

export const toKebab = toCSSProperty;

/** Serializes a style object (used for hashing). */
export function objectToCSS(obj: Record<string, unknown>, indent = ''): string {
  let declarations = '';
  let nested = '';

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value == null || value === false) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      nested += `${indent}${key}{${objectToCSS(value as Record<string, unknown>, indent)}}`;
    } else {
      const prop = toCSSProperty(key);
      declarations += `${indent}${prop}:${toCSSValue(prop, value)};`;
    }
  }

  return declarations + nested;
}

/** At-rules whose body is not a list of style rules for the element. */
const RAW_AT_RULES = /^@(keyframes|-webkit-keyframes|font-face|property|counter-style|font-feature-values)\b/;

/**
 * Turns a style object into rules scoped to `selector`:
 * `{ color, "&:hover": {...}, ".title": {...}, "@media (...)": {...} }`.
 */
export function objectToScopedCSS(obj: Record<string, unknown>, selector: string): string {
  let declarations = '';
  let nested = '';

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value == null || value === false) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const inner = value as Record<string, unknown>;
      if (RAW_AT_RULES.test(key)) {
        nested += `${key}{${rawBlock(inner)}}`;
      } else if (key.startsWith('@')) {
        nested += `${key}{${objectToScopedCSS(inner, selector)}}`;
      } else {
        nested += objectToScopedCSS(inner, nestSelector(selector, key));
      }
    } else {
      const prop = toCSSProperty(key);
      declarations += `${prop}:${toCSSValue(prop, value)};`;
    }
  }

  return (declarations ? `${selector}{${declarations}}` : '') + nested;
}

/** `& .a, &:hover` / `.b` under `.v-x` → `.v-x .a, .v-x:hover` / `.v-x .b`. */
export function nestSelector(parent: string, child: string): string {
  return splitSelectors(child)
    .map((part) => (part.includes('&') ? part.replace(/&/g, parent) : `${parent} ${part}`))
    .join(', ');
}

function splitSelectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Keyframes / font-face bodies: nested objects become `key{...}` without scoping. */
function rawBlock(obj: Record<string, unknown>): string {
  let out = '';
  for (const [key, value] of Object.entries(obj)) {
    if (value == null || value === false) continue;
    if (typeof value === 'object') out += `${key}{${rawBlock(value as Record<string, unknown>)}}`;
    else {
      const prop = toCSSProperty(key);
      out += `${prop}:${toCSSValue(prop, value)};`;
    }
  }
  return out;
}
