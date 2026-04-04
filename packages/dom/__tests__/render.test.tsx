import { describe, it, expect } from 'vitest';
import { render } from '../src/render';
import { createElement } from '../src/jsx-runtime';
import { createSignal } from '@veloz/core';

describe('render', () => {
  it('should render element into container', () => {
    const container = document.createElement('div');
    render(() => createElement('p', null, 'Hello'), container);
    expect(container.innerHTML).toBe('<p>Hello</p>');
  });

  it('should clear existing content', () => {
    const container = document.createElement('div');
    container.innerHTML = '<span>old</span>';
    render(() => createElement('p', null, 'new'), container);
    expect(container.innerHTML).toBe('<p>new</p>');
  });

  it('should return a disposer', () => {
    const container = document.createElement('div');
    const dispose = render(() => createElement('p', null, 'test'), container);
    expect(container.innerHTML).toBe('<p>test</p>');

    dispose();
    expect(container.innerHTML).toBe('');
  });

  it('should render reactive content', () => {
    const container = document.createElement('div');
    const [count, setCount] = createSignal(0);

    render(
      () => createElement('span', null, () => count()),
      container
    );

    expect(container.textContent).toBe('0');
    setCount(42);
    expect(container.textContent).toBe('42');
  });

  it('should render a component', () => {
    const container = document.createElement('div');

    function App() {
      return createElement('h1', null, 'Veloz.js');
    }

    render(() => createElement(App, null), container);
    expect(container.innerHTML).toBe('<h1>Veloz.js</h1>');
  });
});
