import { hash } from './hash.js';
import { insertCSS, hasStyle } from './sheet.js';
import { objectToCSS, objectToScopedCSS } from './object-to-css.js';
import { registerCssPropHandler } from '@velozjs/dom';

/** Converts a `css={{...}}` object into a scoped class name. */
export function processCssProp(obj: Record<string, unknown>): string {
  const className = hash(objectToCSS(obj));
  if (!hasStyle(className)) {
    const scoped = objectToScopedCSS(obj, '.' + className);
    if (scoped) insertCSS(className, scoped);
  }
  return className;
}

export function initCssProp(): void {
  registerCssPropHandler(processCssProp);
}
