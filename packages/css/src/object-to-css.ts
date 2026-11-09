const UPPER_RE = /[A-Z]/g;

export function toKebab(prop: string): string {
  if (prop.startsWith('--')) return prop;
  const kebab = prop.replace(UPPER_RE, (m) => '-' + m.toLowerCase());
  return prop.startsWith('ms') ? '-' + kebab : kebab;
}

/** Serializes a style object (used for hashing). */
export function objectToCSS(obj: Record<string, unknown>, indent = ''): string {
  let declarations = '';
  let nested = '';

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value == null || value === false) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      nested += `${indent}${key}{${objectToCSS(value as Record<string, unknown>, indent)}}`;
    } else {
      declarations += `${indent}${toKebab(key)}:${value};`;
    }
  }

  return declarations + nested;
}

/**
 * Turns a style object into rules scoped to `selector`:
 * `{ color, "&:hover": {...}, ".title": {...}, "@media (...)": {...} }`.
 */
export function objectToScopedCSS(obj: Record<string, unknown>, selector: string): string {
  let declarations = '';
  let nested = '';

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value == null || value === false) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const inner = value as Record<string, unknown>;
      if (key.startsWith('@')) {
        nested += `${key}{${objectToScopedCSS(inner, selector)}}`;
      } else {
        const child = key.includes('&') ? key.replace(/&/g, selector) : `${selector} ${key}`;
        nested += objectToScopedCSS(inner, child);
      }
    } else {
      declarations += `${toKebab(key)}:${value};`;
    }
  }

  return (declarations ? `${selector}{${declarations}}` : '') + nested;
}
