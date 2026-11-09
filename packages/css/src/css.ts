import { hash } from './hash.js';
import { insertCSS } from './sheet.js';
import { nestSelector } from './object-to-css.js';

const RAW_AT_RULES = /^@(keyframes|-webkit-keyframes|font-face|property|counter-style|font-feature-values|import|charset|namespace|layer\s*[^{]*;)/;

interface Block {
  prelude: string;
  body: string;
}

/** Splits CSS into loose declarations and `prelude { body }` blocks (one level). */
function parse(css: string): { declarations: string; blocks: Block[] } {
  let declarations = '';
  const blocks: Block[] = [];
  let i = 0;
  let chunk = '';
  let quote: string | null = null;

  while (i < css.length) {
    const ch = css[i];
    if (quote) {
      chunk += ch;
      if (ch === '\\') chunk += css[++i] ?? '';
      else if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      chunk += ch;
      i++;
      continue;
    }
    if (ch === ';') {
      if (chunk.trim()) declarations += chunk.trim() + ';';
      chunk = '';
      i++;
      continue;
    }
    if (ch === '{') {
      // Find the matching closing brace.
      let depth = 1;
      let j = i + 1;
      let q: string | null = null;
      for (; j < css.length && depth > 0; j++) {
        const c = css[j];
        if (q) {
          if (c === '\\') j++;
          else if (c === q) q = null;
        } else if (c === '"' || c === "'") q = c;
        else if (c === '{') depth++;
        else if (c === '}') depth--;
      }
      blocks.push({ prelude: chunk.trim(), body: css.slice(i + 1, j - 1) });
      chunk = '';
      i = j;
      continue;
    }
    chunk += ch;
    i++;
  }
  if (chunk.trim()) declarations += chunk.trim() + ';';
  return { declarations, blocks };
}

function scope(css: string, selector: string): string {
  const { declarations, blocks } = parse(css);
  let out = declarations ? `${selector}{${declarations}}` : '';
  for (const { prelude, body } of blocks) {
    if (RAW_AT_RULES.test(prelude)) out += `${prelude}{${body.trim()}}`;
    else if (prelude.startsWith('@')) out += `${prelude}{${scope(body, selector)}}`;
    else out += scope(body, nestSelector(selector, prelude));
  }
  return out;
}

/**
 * Scopes a CSS block to `.className`. Bare declarations apply to the class,
 * nested rules are relative to it (`&` marks where it goes, otherwise it's a
 * descendant), at-rules like `@media` scope their contents, and
 * `@keyframes` / `@font-face` are kept as they are.
 */
export function scopeCSS(cssText: string, className: string): string {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutComments.trim() ? scope(withoutComments, '.' + className) : '';
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
