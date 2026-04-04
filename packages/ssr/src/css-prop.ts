import { hash } from '@veloz/css';
import { objectToCSS } from '@veloz/css';
import { insertCSS } from '@veloz/css';

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

  const scoped = scopeObjectCSS(raw, className);
  if (scoped) insertCSS(className, scoped);

  return className;
}
