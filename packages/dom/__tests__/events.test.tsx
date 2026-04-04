import { describe, it, expect, vi } from 'vitest';
import { createElement } from '../src/jsx-runtime';
import { render } from '../src/render';

describe('Event delegation', () => {
  it('should handle click events via delegation', () => {
    const container = document.createElement('div');
    const handler = vi.fn();

    render(
      () => createElement('button', { onClick: handler }, 'Click me'),
      container
    );

    const button = container.querySelector('button')!;
    button.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple event types', () => {
    const container = document.createElement('div');
    const clickHandler = vi.fn();
    const mousedownHandler = vi.fn();

    render(
      () => createElement('div', {
        onClick: clickHandler,
        onMousedown: mousedownHandler,
      }, 'test'),
      container
    );

    const el = container.firstElementChild!;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(mousedownHandler).toHaveBeenCalledTimes(1);
  });
});
