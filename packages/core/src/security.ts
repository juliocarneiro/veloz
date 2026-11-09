/**
 * Shared, DOM-free security helpers used by the renderer, the sanitizer and SSR.
 */

/** Attributes whose value is fetched or navigated to. */
export const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'href', 'src', 'action', 'formaction', 'poster', 'srcset', 'background',
  'cite', 'codebase', 'longdesc', 'data', 'xlink:href', 'ping', 'manifest',
]);

const BLOCKED_SCHEMES = new Set(['javascript', 'vbscript', 'data']);
const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpe?g|webp|avif|bmp);/i;
// Browsers drop ASCII tab/newline anywhere and C0 controls/space at the ends
// before reading the scheme, so "java\tscript:" still runs. Strip them all.
// eslint-disable-next-line no-control-regex
const IGNORED_CHARS = /[\u0000- \u007f]+/g;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

export interface SafeURLOptions {
  /** Allow raster `data:image/...` URLs (for `src`, `poster`, `srcset`). */
  allowDataImages?: boolean;
}

/** True when `url` cannot run script: no `javascript:`, `vbscript:` or (non-image) `data:`. */
export function isSafeURL(url: string, options?: SafeURLOptions): boolean {
  const normalized = String(url).replace(IGNORED_CHARS, '');
  const match = SCHEME.exec(normalized);
  if (!match) return true; // relative URL
  const scheme = match[1].toLowerCase();
  if (!BLOCKED_SCHEMES.has(scheme)) return true;
  return scheme === 'data' && options?.allowDataImages === true && SAFE_DATA_IMAGE.test(normalized);
}

/** Checks a URL attribute value; `srcset` is checked candidate by candidate. */
export function isSafeAttributeURL(name: string, value: string): boolean {
  const attr = name.toLowerCase();
  const allowDataImages = attr === 'src' || attr === 'poster' || attr === 'srcset';
  if (attr === 'srcset') {
    return value
      .split(',')
      .every((candidate) => isSafeURL(candidate.trim().split(/\s+/)[0] ?? '', { allowDataImages }));
  }
  return isSafeURL(value, { allowDataImages });
}

const ATTRIBUTE_NAME = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
const TAG_NAME = /^[a-zA-Z][a-zA-Z0-9-]*$/;

/** Rejects names that would break out of an attribute (spaces, quotes, `=`, `>`...). */
export function isValidAttributeName(name: string): boolean {
  return ATTRIBUTE_NAME.test(name);
}

export function isValidTagName(name: string): boolean {
  return TAG_NAME.test(name);
}
