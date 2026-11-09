import { describe, it, expect } from 'vitest';
import { createElement, Fragment } from '../src/jsx-runtime';
import { createSignal } from '@velozjs/core';

describe('createElement', () => {
  it('should create a DOM element', () => {
    const el = createElement('div', null) as HTMLElement;
    expect(el.tagName).toBe('DIV');
  });

  it('should set attributes', () => {
    const el = createElement('div', { id: 'test', class: 'foo' }) as HTMLElement;
    expect(el.id).toBe('test');
    expect(el.className).toBe('foo');
  });

  it('should add text children', () => {
    const el = createElement('p', null, 'Hello', ' World') as HTMLElement;
    expect(el.textContent).toBe('Hello World');
  });

  it('should add element children', () => {
    const child = createElement('span', null, 'inner') as HTMLElement;
    const parent = createElement('div', null, child) as HTMLElement;
    expect(parent.querySelector('span')?.textContent).toBe('inner');
  });

  it('should handle number children', () => {
    const el = createElement('span', null, 42) as HTMLElement;
    expect(el.textContent).toBe('42');
  });

  it('should skip null and boolean children', () => {
    const el = createElement('div', null, null, false, true, 'visible') as HTMLElement;
    expect(el.textContent).toBe('visible');
  });

  it('should handle nested arrays', () => {
    const el = createElement('ul', null, [
      createElement('li', null, '1'),
      createElement('li', null, '2'),
    ]) as HTMLElement;
    expect(el.querySelectorAll('li').length).toBe(2);
  });

  it('should create functional components', () => {
    function MyComp(props: { name: string }) {
      return createElement('span', null, props.name);
    }
    const el = createElement(MyComp, { name: 'Veloz' }) as HTMLElement;
    expect(el.textContent).toBe('Veloz');
  });

  it('should pass children to components', () => {
    function Wrapper(props: { children: any }) {
      return createElement('div', { class: 'wrapper' }, props.children);
    }
    const el = createElement(Wrapper, null, 'content') as HTMLElement;
    expect(el.className).toBe('wrapper');
    expect(el.textContent).toBe('content');
  });

  it('should handle reactive text children', () => {
    const [count, setCount] = createSignal(0);
    const el = createElement('span', null, count) as HTMLElement;

    document.body.appendChild(el);
    expect(el.textContent).toBe('0');

    setCount(5);
    expect(el.textContent).toBe('5');

    document.body.removeChild(el);
  });

  it('should handle style as object', () => {
    const el = createElement('div', {
      style: { backgroundColor: 'red', fontSize: '14px' }
    }) as HTMLElement;
    expect(el.style.backgroundColor).toBe('red');
    expect(el.style.fontSize).toBe('14px');
  });

  it('should handle style as string', () => {
    const el = createElement('div', {
      style: 'color: blue;'
    }) as HTMLElement;
    expect(el.style.color).toBe('blue');
  });

  it('should handle event handlers', () => {
    let clicked = false;
    const el = createElement('button', {
      onClick: () => { clicked = true; }
    }) as HTMLElement;
    expect(el).toBeTruthy();
  });
});

describe('Fragment', () => {
  it('should return child nodes', () => {
    const result = Fragment({
      children: [
        createElement('span', null, 'a'),
        createElement('span', null, 'b'),
      ]
    });
    expect(Array.isArray(result)).toBe(true);
    expect((result as Node[]).length).toBe(2);
  });

  it('should handle single child', () => {
    const result = Fragment({
      children: createElement('div', null, 'solo')
    });
    expect(result).toBeInstanceOf(Node);
  });

  it('should handle empty children', () => {
    const result = Fragment({});
    expect(result).toBeNull();
  });
});
