import { describe, it, expect, beforeEach } from 'vitest';
import * as C from '../src/server-components.js';
import { Match } from '../src/server-components.js';

// Components return HTML with region markers; compare the inner HTML.
const out = (r: unknown) => renderChildren(r).replace(/<!--\[-->|<!--\]-->/g, '');
const Show = (p: any) => out(C.Show(p));
const For = (p: any) => out(C.For(p));
const Switch = (p: any) => out(C.Switch(p));
const Portal = (p: any) => out(C.Portal(p));
const ErrorBoundary = (p: any) => out(C.ErrorBoundary(p));
const Dynamic = (p: any) => out(C.Dynamic(p));
import { jsx, renderChildren } from '../src/jsx-runtime.js';
import { resetHydrationCounter } from '../src/hydration.js';

beforeEach(() => {
  resetHydrationCounter();
});

describe('Show (server)', () => {
  it('should render children when truthy', () => {
    const html = Show({ when: true, children: 'visible' });
    expect(html).toBe('visible');
  });

  it('should render fallback when falsy', () => {
    const html = Show({ when: false, fallback: 'hidden', children: 'visible' });
    expect(html).toBe('hidden');
  });

  it('should return empty when falsy and no fallback', () => {
    const html = Show({ when: false, children: 'visible' });
    expect(html).toBe('');
  });

  it('should support function `when`', () => {
    const html = Show({ when: () => 'data', children: (val: string) => `got: ${val}` });
    expect(html).toContain('got: data');
  });

  it('should support children as render function', () => {
    const html = Show({
      when: 42,
      children: (val: number) => jsx('span', { children: String(val) }),
    });
    expect(html).toContain('42');
  });
});

describe('For (server)', () => {
  it('should render each item', () => {
    const html = For({
      each: ['a', 'b', 'c'],
      children: (item: string, index: () => number) =>
        jsx('li', { children: `${index()}: ${item}` }),
    });
    expect(html).toContain('0: a');
    expect(html).toContain('1: b');
    expect(html).toContain('2: c');
  });

  it('should render fallback for empty array', () => {
    const html = For({
      each: [],
      fallback: 'empty',
      children: (item: never) => jsx('li', { children: String(item) }),
    });
    expect(html).toBe('empty');
  });

  it('should return empty for empty array and no fallback', () => {
    const html = For({
      each: [],
      children: (item: never) => jsx('li', { children: String(item) }),
    });
    expect(html).toBe('');
  });

  it('should support function `each`', () => {
    const html = For({
      each: () => [1, 2],
      children: (item: number) => jsx('span', { children: String(item) }),
    });
    expect(html).toContain('1');
    expect(html).toContain('2');
  });
});

describe('Switch/Match (server)', () => {
  it('should render matching case', () => {
    const html = Switch({
      children: [
        Match({ when: false, children: 'no' }),
        Match({ when: true, children: 'yes' }),
      ],
    });
    expect(html).toBe('yes');
  });

  it('should render fallback when no match', () => {
    const html = Switch({
      fallback: 'default',
      children: [
        Match({ when: false, children: 'no' }),
      ],
    });
    expect(html).toBe('default');
  });

  it('should render first match only', () => {
    const html = Switch({
      children: [
        Match({ when: 'first', children: 'a' }),
        Match({ when: 'second', children: 'b' }),
      ],
    });
    expect(html).toBe('a');
  });

  it('should support render function in Match', () => {
    const html = Switch({
      children: [
        Match({ when: 42, children: (val: number) => `value: ${val}` }),
      ],
    });
    expect(html).toContain('value: 42');
  });
});

describe('Portal (server)', () => {
  it('renders nothing on the server (content is created on the client)', () => {
    const html = Portal({ children: jsx('div', { children: 'modal' }) });
    expect(html).toBe('');
  });
});

describe('ErrorBoundary (server)', () => {
  it('should render children when no error', () => {
    const html = ErrorBoundary({
      fallback: (err) => `Error: ${err.message}`,
      children: 'safe content',
    });
    expect(html).toBe('safe content');
  });
});

describe('Dynamic (server)', () => {
  it('should render string component', () => {
    const html = Dynamic({ component: 'div', children: 'hello' } as any);
    expect(html).toContain('<div');
    expect(html).toContain('hello');
  });

  it('should render function component', () => {
    function Comp(props: { text: string }) {
      return jsx('span', { children: props.text });
    }
    const html = Dynamic({ component: Comp, text: 'hi' } as any);
    expect(html).toContain('<span');
    expect(html).toContain('hi');
  });

  it('should return empty for falsy component', () => {
    const html = Dynamic({ component: '' } as any);
    expect(html).toBe('');
  });
});
