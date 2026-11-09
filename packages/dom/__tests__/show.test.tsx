import { describe, it, expect } from 'vitest';
import { render } from '../src/render';
import { createElement } from '../src/jsx-runtime';
import { Show } from '../src/components/Show';
import { createSignal } from '@velozjs/core';

describe('Show', () => {
  it('should render children when condition is truthy', () => {
    const container = document.createElement('div');
    render(() =>
      createElement(Show as any, {
        when: true,
        children: createElement('span', null, 'visible'),
      }),
      container
    );
    expect(container.textContent).toBe('visible');
  });

  it('should render fallback when condition is falsy', () => {
    const container = document.createElement('div');
    render(() =>
      createElement(Show as any, {
        when: false,
        fallback: createElement('span', null, 'fallback'),
        children: createElement('span', null, 'content'),
      }),
      container
    );
    expect(container.textContent).toBe('fallback');
  });

  it('should toggle between children and fallback reactively', () => {
    const container = document.createElement('div');
    const [show, setShow] = createSignal(true);

    render(() =>
      createElement(Show as any, {
        get when() { return show(); },
        fallback: createElement('span', null, 'hidden'),
        children: createElement('span', null, 'shown'),
      }),
      container
    );

    expect(container.textContent).toContain('shown');

    setShow(false);
    expect(container.textContent).toContain('hidden');

    setShow(true);
    expect(container.textContent).toContain('shown');
  });
});
