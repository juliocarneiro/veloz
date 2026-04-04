import {
  createOwner,
  setCurrentOwner,
  disposeOwner,
} from '@veloz/core';
import { resetHydrationCounter } from './hydration.js';
import { getSSRStyles, resetSSRStyles } from '@veloz/css';

export interface SSRResult {
  html: string;
  css: string;
}

function unwrapHTML(value: unknown): string {
  if (value != null && typeof value === 'object' && 'value' in value) {
    return String((value as { value: string }).value);
  }
  return String(value ?? '');
}

export function renderToString(fn: () => unknown): SSRResult {
  resetHydrationCounter();
  resetSSRStyles();

  const owner = createOwner();
  const prev = setCurrentOwner(owner);

  try {
    const result = fn();
    const html = unwrapHTML(result);
    const css = getSSRStyles();
    return { html, css };
  } finally {
    setCurrentOwner(prev);
    disposeOwner(owner);
  }
}
