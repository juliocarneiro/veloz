import { describe, it, expect, beforeEach } from 'vitest';
import { insertCSS, hasStyle, clearStyles } from '../src/sheet';

describe('sheet', () => {
  beforeEach(() => {
    clearStyles();
  });

  it('tracks inserted style IDs', () => {
    expect(hasStyle('test-1')).toBe(false);
    insertCSS('test-1', '.test-1{color:red}');
    expect(hasStyle('test-1')).toBe(true);
  });

  it('does not insert duplicate styles', () => {
    insertCSS('dup-1', '.dup-1{color:red}');
    insertCSS('dup-1', '.dup-1{color:blue}');
    expect(hasStyle('dup-1')).toBe(true);
  });

  it('clears all styles', () => {
    insertCSS('c-1', '.c-1{color:red}');
    insertCSS('c-2', '.c-2{color:blue}');
    expect(hasStyle('c-1')).toBe(true);
    expect(hasStyle('c-2')).toBe(true);
    clearStyles();
    expect(hasStyle('c-1')).toBe(false);
    expect(hasStyle('c-2')).toBe(false);
  });

  it('injects CSS into the DOM via fallback style tag', () => {
    insertCSS('dom-1', '.dom-1{color:green}');
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl).toBeTruthy();
    expect(styleEl!.textContent).toContain('.dom-1');
  });
});
