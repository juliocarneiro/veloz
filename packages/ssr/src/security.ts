import { URL_ATTRIBUTES, isSafeAttributeURL, isSafeURL, isValidAttributeName } from '@velozjs/core';

// Same checks as @velozjs/dom, so code that calls them also runs on the server.

/** Returns false for attributes that must not be set as given. */
export function validateAttribute(name: string, value: unknown): boolean {
  if (!isValidAttributeName(name)) return false;
  if (/^on/i.test(name) && typeof value === 'string') return false;
  if (URL_ATTRIBUTES.has(name.toLowerCase()) && typeof value === 'string' && !isSafeAttributeURL(name, value)) return false;
  return true;
}

/** Returns the URL trimmed, or `about:blank` if it could run script. */
export function sanitizeURL(url: string): string {
  return isSafeURL(url) ? url.trim() : 'about:blank';
}

/**
 * On the server there is no current page, so only URLs that name their own
 * origin (`https://…`, `//host/…`, `mailto:`…) count as external.
 */
export function isExternalURL(url: string): boolean {
  return /^([a-z][a-z\d+.-]*:|\/\/)/i.test(url.trim());
}
