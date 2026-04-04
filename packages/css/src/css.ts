import { hash } from './hash.js';
import { insertCSS } from './sheet.js';

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

export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let raw = '';
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < values.length) {
      raw += String(values[i]);
    }
  }

  const className = hash(raw);
  const scoped = scopeCSS(raw, className);

  if (scoped) {
    insertCSS(className, scoped);
  }

  return className;
}
