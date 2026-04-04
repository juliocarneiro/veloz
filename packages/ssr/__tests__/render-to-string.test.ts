import { describe, it, expect } from 'vitest';
import { renderToString } from '../src/render-to-string.js';
import { jsx } from '../src/jsx-runtime.js';
import { css } from '@veloz/css';
import { createSignal } from '@veloz/core';

describe('renderToString', () => {
  it('should return html and css', () => {
    const result = renderToString(() => jsx('div', { children: 'hello' }));
    expect(result.html).toContain('<div');
    expect(result.html).toContain('hello');
    expect(typeof result.css).toBe('string');
  });

  it('should collect CSS during render', () => {
    const result = renderToString(() => {
      const className = css`color: red;`;
      return jsx('div', { class: className, children: 'styled' });
    });

    expect(result.html).toContain('styled');
    expect(result.css).toContain('color');
    expect(result.css).toContain('red');
  });

  it('should reset hydration IDs between calls', () => {
    const result1 = renderToString(() => jsx('div', { children: 'a' }));
    const result2 = renderToString(() => jsx('div', { children: 'b' }));

    expect(result1.html).toContain('data-hk="0"');
    expect(result2.html).toContain('data-hk="0"');
  });

  it('should render nested components', () => {
    function Child(props: { text: string }) {
      return jsx('span', { children: props.text });
    }
    function Parent() {
      return jsx('div', {
        children: jsx(Child, { text: 'nested' }),
      });
    }

    const result = renderToString(() => jsx(Parent, {}));
    expect(result.html).toContain('<div');
    expect(result.html).toContain('<span');
    expect(result.html).toContain('nested');
  });

  it('should handle signals in SSR', () => {
    const [count] = createSignal(5);

    const result = renderToString(() =>
      jsx('span', { children: () => String(count()) })
    );
    expect(result.html).toContain('5');
  });
});
