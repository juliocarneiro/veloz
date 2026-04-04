import { hash } from './hash.js';
import { insertCSS, hasStyle } from './sheet.js';
import { objectToCSS } from './object-to-css.js';
import { registerCssPropHandler } from '@veloz/dom';

function scopeObjectCSS(cssText: string, className: string): string {
  const selector = '.' + className;
  const trimmed = cssText.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/(?<=\})/);
  let topLevel = '';
  let nested = '';

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.startsWith('&') || p.startsWith('@media')) {
      nested += p.replace(/&/g, selector) + '\n';
    } else {
      topLevel += p;
    }
  }

  let result = '';
  if (topLevel) {
    const clean = topLevel.replace(/\}$/g, '').trim();
    if (clean) result += `${selector}{${clean}}\n`;
  }
  if (nested) result += nested;

  return result.trim();
}

export function processCssProp(obj: Record<string, unknown>): string {
  const raw = objectToCSS(obj);
  const className = hash(raw);

  if (!hasStyle(className)) {
    const scoped = scopeObjectCSS(raw, className);
    if (scoped) insertCSS(className, scoped);
  }

  return className;
}

export function initCssProp(): void {
  registerCssPropHandler(processCssProp);
}
