/** A value, or a function that returns it (read reactively). */
export type MaybeAccessor<T> = T | (() => T);

/** Calls `value` if it is a function, otherwise returns it. */
export function access<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

// CSS properties that take plain numbers (no px).
const UNITLESS = new Set([
  'animation-iteration-count', 'aspect-ratio', 'border-image-outset', 'border-image-slice',
  'border-image-width', 'column-count', 'columns', 'fill-opacity', 'flex', 'flex-grow',
  'flex-shrink', 'flood-opacity', 'font-weight', 'grid-area', 'grid-column', 'grid-column-end',
  'grid-column-start', 'grid-row', 'grid-row-end', 'grid-row-start', 'initial-letter',
  'line-clamp', 'line-height', 'opacity', 'order', 'orphans', 'scale', 'stop-opacity',
  'stroke-dashoffset', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'tab-size',
  'widows', 'z-index', 'zoom',
]);

/** `backgroundColor` → `background-color`; custom properties are kept as is. */
export function toCSSProperty(name: string): string {
  if (name.startsWith('--')) return name;
  const kebab = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return /^ms-/.test(kebab) ? `-${kebab}` : kebab;
}

/** Numbers get `px`, except for unitless properties and custom properties. */
export function toCSSValue(property: string, value: unknown): string {
  if (typeof value === 'number' && value !== 0 && !property.startsWith('--') && !UNITLESS.has(property)) {
    return `${value}px`;
  }
  return String(value);
}
