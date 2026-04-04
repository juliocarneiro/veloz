import { describe, it, expect, beforeEach } from 'vitest';
import { css } from '../src/css';
import { clearStyles, hasStyle } from '../src/sheet';

describe('css tagged template', () => {
  beforeEach(() => {
    clearStyles();
  });

  it('returns a class name string', () => {
    const className = css`color: red;`;
    expect(typeof className).toBe('string');
    expect(className).toMatch(/^v-[a-z0-9]+$/);
  });

  it('inserts style into the sheet', () => {
    const className = css`color: red;`;
    expect(hasStyle(className)).toBe(true);
  });

  it('wraps top-level declarations in scoped selector', () => {
    const className = css`
      color: red;
      font-size: 16px;
    `;
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl!.textContent).toContain(`.${className}`);
    expect(styleEl!.textContent).toContain('color: red');
  });

  it('replaces & with scoped class in nested selectors', () => {
    const className = css`
      color: red;
      &:hover {
        color: blue;
      }
    `;
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl!.textContent).toContain(`.${className}:hover`);
  });

  it('supports interpolated values', () => {
    const size = '24px';
    const className = css`font-size: ${size};`;
    expect(typeof className).toBe('string');
    expect(hasStyle(className)).toBe(true);
  });

  it('returns same class for same content (dedup)', () => {
    const a = css`margin: 0;`;
    clearStyles();
    const b = css`margin: 0;`;
    expect(a).toBe(b);
  });

  it('supports nested child selectors', () => {
    const className = css`
      padding: 1rem;
      & .child {
        color: green;
      }
    `;
    const styleEl = document.querySelector('style[data-veloz-css]');
    expect(styleEl!.textContent).toContain(`.${className} .child`);
  });
});
