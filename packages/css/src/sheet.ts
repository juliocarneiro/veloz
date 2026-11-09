const inserted = new Set<string>();
// Server: every style ever registered. Module-level `css` calls run once per
// process, so every render needs the full set; this map is the source of truth.
const serverStyleMap = new Map<string, string>();
let sheet: CSSStyleSheet | null = null;
let fallbackEl: HTMLStyleElement | null = null;
let ssrHydrated = false;

const isServer = () => typeof document === 'undefined';

function hydrateFromSSR(): void {
  if (ssrHydrated || isServer()) return;
  ssrHydrated = true;

  const el = document.querySelector('style[data-veloz-css]') as HTMLStyleElement | null;
  if (!el) return;

  const matches = (el.textContent || '').match(/\.v-[a-z0-9]+/g);
  if (matches) for (const m of matches) inserted.add(m.slice(1));
  fallbackEl = el;
}

function getSheet(): CSSStyleSheet | null {
  if (sheet) return sheet;
  if (isServer()) return null;
  if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in document) {
    try {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      return sheet;
    } catch {
      return null;
    }
  }
  return null;
}

function getFallback(): HTMLStyleElement | null {
  if (fallbackEl) return fallbackEl;
  if (isServer()) return null;
  fallbackEl = document.createElement('style');
  fallbackEl.setAttribute('data-veloz-css', '');
  document.head.appendChild(fallbackEl);
  return fallbackEl;
}

/** Splits CSS into top-level rules, keeping nested blocks (`@media {...}`) whole. */
export function splitRules(cssText: string): string[] {
  const rules: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      const rule = cssText.slice(start, i + 1).trim();
      if (rule) rules.push(rule);
      start = i + 1;
    }
  }
  return rules;
}

export function insertCSS(id: string, cssText: string): void {
  if (isServer()) {
    if (!serverStyleMap.has(id)) serverStyleMap.set(id, cssText);
    inserted.add(id);
    return;
  }

  hydrateFromSSR();
  if (inserted.has(id)) return;
  inserted.add(id);

  const s = getSheet();
  if (s) {
    for (const rule of splitRules(cssText)) {
      try {
        s.insertRule(rule, s.cssRules.length);
      } catch {
        // Invalid rule (e.g. a typo in user CSS): skip it, keep the rest.
      }
    }
    return;
  }

  const el = getFallback();
  if (el) el.textContent += cssText;
}

export function hasStyle(id: string): boolean {
  return inserted.has(id);
}

export function clearStyles(): void {
  inserted.clear();
  if (sheet) while (sheet.cssRules.length) sheet.deleteRule(0);
  if (fallbackEl) fallbackEl.textContent = '';
}

/**
 * Every style registered on the server, ready for `<style data-veloz-css>`.
 * `</style` is escaped so a value can never close the tag.
 */
export function getSSRStyles(): string {
  return Array.from(serverStyleMap.values())
    .join('\n')
    .replace(/<\/(style)/gi, '<\\/$1');
}

/** Kept for compatibility: styles persist across renders (see getSSRStyles). */
export function resetSSRStyles(): void {}
