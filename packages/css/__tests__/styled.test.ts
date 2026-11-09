import { describe, it, expect, beforeEach } from 'vitest';
import { styled } from '../src/styled';
import { clearStyles, hasStyle } from '../src/sheet';

describe('styled', () => {
  beforeEach(() => {
    clearStyles();
  });

  it('creates a component that returns an HTML element', () => {
    const Box = styled('div')`padding: 1rem;`;
    const el = Box({});
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  it('applies a generated class to the element', () => {
    const Box = styled('div')`padding: 1rem;`;
    const el = Box({});
    expect(el.className).toMatch(/^v-[a-z0-9]+$/);
  });

  it('inserts styles into the sheet', () => {
    const Box = styled('div')`color: red;`;
    const el = Box({});
    expect(hasStyle(el.className.split(' ')[0])).toBe(true);
  });

  it('merges with existing class prop', () => {
    const Box = styled('div')`padding: 1rem;`;
    const el = Box({ class: 'custom' });
    expect(el.className).toContain('custom');
    expect(el.className).toMatch(/v-[a-z0-9]+/);
  });

  it('passes through event handlers', () => {
    const Box = styled('button')`color: red;`;
    let clicked = false;
    const el = Box({ onClick: () => { clicked = true; } });
    document.body.appendChild(el); // delegated events need the element in a document
    el.click();
    expect(clicked).toBe(true);
  });

  it('passes through HTML attributes', () => {
    const Btn = styled('button')`padding: 8px;`;
    const el = Btn({ type: 'submit', disabled: 'true' });
    expect(el.getAttribute('type')).toBe('submit');
  });

  it('creates the correct element tag', () => {
    const Header = styled('h1')`font-size: 2rem;`;
    const el = Header({});
    expect(el.tagName).toBe('H1');
  });

  it('supports dynamic interpolations from props', () => {
    const Box = styled('div')`
      color: ${(props: any) => props.active ? 'blue' : 'gray'};
    `;
    const el1 = Box({ active: true });
    const el2 = Box({ active: false });
    expect(el1.className).not.toBe(el2.className);
  });

  it('handles ref prop', () => {
    const Box = styled('div')`color: red;`;
    let captured: HTMLElement | null = null;
    Box({ ref: (el: HTMLElement) => { captured = el; } });
    expect(captured).toBeInstanceOf(HTMLElement);
  });
});
