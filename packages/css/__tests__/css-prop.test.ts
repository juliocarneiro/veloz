import { describe, it, expect, beforeEach } from 'vitest';
import { processCssProp } from '../src/css-prop';
import { clearStyles, hasStyle } from '../src/sheet';

describe('processCssProp', () => {
  beforeEach(() => {
    clearStyles();
  });

  it('returns a class name string', () => {
    const className = processCssProp({ color: 'red' });
    expect(typeof className).toBe('string');
    expect(className).toMatch(/^v-[a-z0-9]+$/);
  });

  it('inserts styles into the sheet', () => {
    const className = processCssProp({ display: 'flex', gap: '1rem' });
    expect(hasStyle(className)).toBe(true);
  });

  it('converts camelCase to kebab-case', () => {
    const className = processCssProp({ backgroundColor: 'blue' });
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl!.textContent).toContain('background-color:blue');
  });

  it('handles nested pseudo-selectors', () => {
    const className = processCssProp({
      color: 'red',
      '&:hover': { color: 'blue' },
    });
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl!.textContent).toContain(`.${className}`);
  });

  it('deduplicates identical objects', () => {
    const a = processCssProp({ margin: '0' });
    const b = processCssProp({ margin: '0' });
    expect(a).toBe(b);
  });
});
