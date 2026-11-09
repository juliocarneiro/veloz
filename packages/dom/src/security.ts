import { URL_ATTRIBUTES, isSafeAttributeURL, isSafeURL, isValidAttributeName } from '@velozjs/core';

function warn(message: string): void {
  if (typeof console !== 'undefined') console.warn(`[Veloz Security] ${message}`);
}

/** Returns false (and warns) for attributes that must not be set as given. */
export function validateAttribute(name: string, value: unknown): boolean {
  if (!isValidAttributeName(name)) {
    warn(`Blocked invalid attribute name "${name}".`);
    return false;
  }

  if (/^on/i.test(name) && typeof value === 'string') {
    warn(`Blocked string event handler "${name}". Use a function instead.`);
    return false;
  }

  if (URL_ATTRIBUTES.has(name.toLowerCase()) && typeof value === 'string') {
    if (!isSafeAttributeURL(name, value)) {
      warn(`Blocked dangerous URL in "${name}".`);
      return false;
    }
  }

  return true;
}

/** Returns the URL trimmed, or `about:blank` if it could run script. */
export function sanitizeURL(url: string): string {
  return isSafeURL(url) ? url.trim() : 'about:blank';
}

export function isExternalURL(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}
