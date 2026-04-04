const inserted = new Set<string>();
const serverStyles: string[] = [];
const serverStyleMap = new Map<string, string>();
let sheet: CSSStyleSheet | null = null;
let fallbackEl: HTMLStyleElement | null = null;
let ssrHydrated = false;

function hydrateFromSSR(): void {
  if (ssrHydrated || typeof document === 'undefined') return;
  ssrHydrated = true;

  const el = document.querySelector('style[data-veloz-css]') as HTMLStyleElement | null;
  if (!el) return;

  const text = el.textContent || '';
  const matches = text.match(/\.v-[a-z0-9]+/g);
  if (matches) {
    for (const m of matches) {
      inserted.add(m.slice(1));
    }
  }

  fallbackEl = el;
}

function getSheet(): CSSStyleSheet | null {
  if (sheet) return sheet;

  if (typeof document === 'undefined') return null;

  if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in document) {
    sheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    return sheet;
  }

  return null;
}

function getFallback(): HTMLStyleElement | null {
  if (fallbackEl) return fallbackEl;
  if (typeof document === 'undefined') return null;

  fallbackEl = document.createElement('style');
  fallbackEl.setAttribute('data-veloz-css', '');
  document.head.appendChild(fallbackEl);
  return fallbackEl;
}

export function insertCSS(id: string, cssText: string): void {
  hydrateFromSSR();

  if (inserted.has(id)) return;
  inserted.add(id);

  if (typeof document === 'undefined') {
    serverStyleMap.set(id, cssText);
    serverStyles.push(cssText);
    return;
  }

  const s = getSheet();
  if (s) {
    const rules = cssText.split('}').filter(r => r.trim());
    for (const rule of rules) {
      const full = rule.trim() + '}';
      try {
        s.insertRule(full, s.cssRules.length);
      } catch (_) {
        /* ignore invalid rules in dev */
      }
    }
    return;
  }

  const el = getFallback();
  if (el) {
    el.textContent += cssText;
  }
}

export function hasStyle(id: string): boolean {
  return inserted.has(id);
}

export function clearStyles(): void {
  inserted.clear();
  if (sheet) {
    while (sheet.cssRules.length) sheet.deleteRule(0);
  }
  if (fallbackEl) {
    fallbackEl.textContent = '';
  }
}

export function getSSRStyles(): string {
  if (serverStyles.length > 0) {
    return serverStyles.join('\n');
  }
  return Array.from(serverStyleMap.values()).join('\n');
}

export function resetSSRStyles(): void {
  serverStyles.length = 0;
}
