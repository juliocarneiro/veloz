const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript):/i;

const URL_ATTRIBUTES = new Set([
  'href', 'src', 'action', 'formaction', 'poster', 'srcset',
  'background', 'cite', 'codebase', 'longdesc',
]);

export function validateAttribute(name: string, value: unknown): boolean {
  if (name.startsWith('on') && typeof value === 'string') {
    if (typeof console !== 'undefined') {
      console.warn(
        `[Veloz Security] Blocked string event handler "${name}". Use a function instead.`
      );
    }
    return false;
  }

  if (URL_ATTRIBUTES.has(name.toLowerCase()) && typeof value === 'string') {
    if (DANGEROUS_URL_SCHEMES.test(value.trim())) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[Veloz Security] Blocked dangerous URL in "${name}": ${value}`
        );
      }
      return false;
    }
  }

  return true;
}

export function sanitizeURL(url: string): string {
  const trimmed = url.trim();
  if (DANGEROUS_URL_SCHEMES.test(trimmed)) {
    return 'about:blank';
  }
  return trimmed;
}

export function isExternalURL(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}
