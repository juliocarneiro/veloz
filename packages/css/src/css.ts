import { hash } from './hash.js';
import { insertCSS } from './sheet.js';

/**
 * Scopes a CSS block to `.className`: bare declarations go on the class,
 * `&` in nested rules is replaced by the class selector.
 */
export function scopeCSS(cssText: string, className: string): string {
  const selector = '.' + className;
  const trimmed = cssText.trim();
  if (!trimmed) return '';

  let result = '';
  let topLevel = '';
  let buffer = '';
  let depth = 0;

  for (const raw of trimmed.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }

    if (depth === 0 && buffer === '' && !line.includes('{')) {
      topLevel += line + '\n';
      continue;
    }

    buffer += line + '\n';
    if (depth === 0) {
      result += buffer.trim().replace(/&/g, selector) + '\n';
      buffer = '';
    }
  }

  if (buffer.trim()) result += buffer.trim().replace(/&/g, selector) + '\n';
  if (topLevel) result = `${selector}{${topLevel.trim()}}\n` + result;
  return result.trim();
}

/** Tagged template that returns a scoped class name. */
export function css(strings: TemplateStringsArray, ...values: unknown[]): string {
  let raw = '';
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < values.length) raw += String(values[i] ?? '');
  }

  const className = hash(raw);
  const scoped = scopeCSS(raw, className);
  if (scoped) insertCSS(className, scoped);
  return className;
}
