import { describe, it, expect } from 'vitest';
import { render } from '../src/render';
import { createElement as h } from '../src/jsx-runtime';
import { For } from '../src/components/For';
import { createSignal } from '@velozjs/core';

const mount = () => {
  const c = document.createElement('div');
  document.body.appendChild(c);
  return c;
};

describe('form state is applied after children and other attributes', () => {
  it('<select value> selects an option rendered as a child', () => {
    const c = mount();
    render(() => h('select', { value: 'b' }, h('option', { value: 'a' }, 'A'), h('option', { value: 'b' }, 'B')), c);
    expect((c.querySelector('select') as HTMLSelectElement).value).toBe('b');
  });

  it('<select value> works with options from For and updates reactively', () => {
    const c = mount();
    const [v, setV] = createSignal('y');
    render(
      () => h('select', { value: () => v() }, h(For as any, { each: ['x', 'y', 'z'], children: (o: string) => h('option', { value: o }, o) })),
      c
    );
    const select = c.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('y');
    setV('z');
    expect(select.value).toBe('z');
  });

  it('<input type=range value> is not clamped when value comes before min/max', () => {
    const c = mount();
    render(() => h('input', { value: 150, type: 'range', min: 0, max: 200 }), c);
    expect((c.querySelector('input') as HTMLInputElement).value).toBe('150');
  });
});

describe('style values', () => {
  it('adds px to numbers except unitless properties and custom properties', () => {
    const c = mount();
    render(() => h('div', { style: { padding: 8, opacity: 0.5, zIndex: 3, lineHeight: 1.5, '--gap': 4, margin: 0 } }), c);
    const s = (c.firstElementChild as HTMLElement).style;
    expect(s.padding).toBe('8px');
    expect(s.opacity).toBe('0.5');
    expect(s.zIndex).toBe('3');
    expect(s.lineHeight).toBe('1.5');
    expect(s.getPropertyValue('--gap')).toBe('4');
    expect(s.margin).toBe('0px');
  });
});
