import { describe, it, expect } from 'vitest';
import { render } from '../src/render';
import { createElement } from '../src/jsx-runtime';
import { For } from '../src/components/For';
import { createSignal } from '@veloz/core';

describe('For', () => {
  it('should render a list of items', () => {
    const container = document.createElement('div');

    render(() =>
      createElement(For as any, {
        each: ['a', 'b', 'c'],
        children: (item: string) => createElement('span', null, item),
      }),
      container
    );

    expect(container.querySelectorAll('span').length).toBe(3);
    expect(container.textContent).toBe('abc');
  });

  it('should render fallback for empty list', () => {
    const container = document.createElement('div');

    render(() =>
      createElement(For as any, {
        each: [],
        fallback: createElement('span', null, 'empty'),
        children: (item: string) => createElement('span', null, item),
      }),
      container
    );

    expect(container.textContent).toBe('empty');
  });

  it('should update when list changes', () => {
    const container = document.createElement('div');
    const [items, setItems] = createSignal(['x', 'y']);

    render(() =>
      createElement(For as any, {
        get each() { return items(); },
        children: (item: string) => createElement('span', null, item),
      }),
      container
    );

    expect(container.textContent).toBe('xy');

    setItems(['a', 'b', 'c']);
    expect(container.querySelectorAll('span').length).toBe(3);
    expect(container.textContent).toBe('abc');
  });

  it('should provide reactive index', () => {
    const container = document.createElement('div');

    render(() =>
      createElement(For as any, {
        each: ['first', 'second'],
        children: (item: string, index: () => number) =>
          createElement('span', null, `${index()}: ${item}`),
      }),
      container
    );

    expect(container.textContent).toContain('0: first');
    expect(container.textContent).toContain('1: second');
  });
});
