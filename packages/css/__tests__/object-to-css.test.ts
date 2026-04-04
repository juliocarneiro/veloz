import { describe, it, expect } from 'vitest';
import { objectToCSS } from '../src/object-to-css';

describe('objectToCSS', () => {
  it('converts camelCase to kebab-case', () => {
    const result = objectToCSS({ backgroundColor: 'red', fontSize: '16px' });
    expect(result).toContain('background-color:red;');
    expect(result).toContain('font-size:16px;');
  });

  it('handles plain lowercase properties', () => {
    const result = objectToCSS({ color: 'blue', display: 'flex' });
    expect(result).toContain('color:blue;');
    expect(result).toContain('display:flex;');
  });

  it('handles nested selectors', () => {
    const result = objectToCSS({
      color: 'red',
      '&:hover': { color: 'blue' },
    });
    expect(result).toContain('color:red;');
    expect(result).toContain('&:hover{color:blue;}');
  });

  it('handles media queries', () => {
    const result = objectToCSS({
      fontSize: '14px',
      '@media (min-width: 768px)': { fontSize: '18px' },
    });
    expect(result).toContain('font-size:14px;');
    expect(result).toContain('@media (min-width: 768px){font-size:18px;}');
  });

  it('skips null and undefined values', () => {
    const result = objectToCSS({ color: 'red', background: null as any, border: undefined as any });
    expect(result).toBe('color:red;');
  });

  it('preserves CSS custom properties', () => {
    const result = objectToCSS({ '--my-color': 'red' });
    expect(result).toBe('--my-color:red;');
  });

  it('handles ms-prefixed properties', () => {
    const result = objectToCSS({ msFlexAlign: 'center' });
    expect(result).toContain('-ms-flex-align:center;');
  });
});
