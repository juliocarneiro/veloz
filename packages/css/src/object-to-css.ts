const UPPER_RE = /[A-Z]/g;

function toKebab(prop: string): string {
  if (prop.startsWith('--')) return prop;
  if (prop.startsWith('ms')) return '-' + prop.replace(UPPER_RE, m => '-' + m.toLowerCase());
  return prop.replace(UPPER_RE, m => '-' + m.toLowerCase());
}

export function objectToCSS(obj: Record<string, unknown>, indent = ''): string {
  let declarations = '';
  let nested = '';

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (value == null) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      nested += `${indent}${key}{${objectToCSS(value as Record<string, unknown>, indent)}}`;
    } else {
      declarations += `${indent}${toKebab(key)}:${value};`;
    }
  }

  return declarations + nested;
}
