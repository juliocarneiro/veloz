import { describe, it, expect, vi } from 'vitest';
import { renderToString, renderToStream, jsx, Show } from '../src/index.js';
import { css, styled } from '@velozjs/css';
import { createContext, useContext } from '@velozjs/core';

describe('CSS across requests', () => {
  it('keeps styles seen in earlier renders when a new one appears', () => {
    const a = css`color: red;`;
    renderToString(() => jsx('div', { class: a }));
    const r2 = renderToString(() => {
      const b = css`color: blue;`;
      return jsx('div', { class: `${a} ${b}` });
    });
    expect(r2.css).toContain('red');
    expect(r2.css).toContain('blue');
  });

  it('cannot close the <style> tag', () => {
    css`content: "</style><script>alert(1)</script>";`;
    const { css: out } = renderToString(() => jsx('div', {}));
    expect(out.toLowerCase()).not.toContain('</style');
  });
});

describe('security', () => {
  it('drops tab-obfuscated javascript: URLs', () => {
    const { html } = renderToString(() => jsx('a', { href: 'java\tscript:alert(1)', children: 'x' }));
    expect(html).not.toContain('script:');
  });

  it('drops attribute names that would inject markup', () => {
    const { html } = renderToString(() => jsx('div', { 'x onmouseover="alert(1)" y': '1' }));
    expect(html).not.toContain('onmouseover');
  });

  it('never prints innerHTML unsanitized', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { html } = renderToString(() => jsx('div', { innerHTML: '<img src=x onerror=alert(1)>' }));
    expect(html).not.toContain('onerror');
    warn.mockRestore();
  });

  it('rejects invalid tag names', () => {
    expect(() => renderToString(() => jsx('div><script', {}))).toThrow(/Invalid tag/);
  });
});

describe('rendering', () => {
  it('marks dynamic children so hydration can find them', () => {
    const { html } = renderToString(() => jsx('p', { children: ['Count: ', () => 2] }));
    expect(html).toBe('<p data-hk="0">Count: <!--[-->2<!--]--></p>');
  });

  it('renders styled components on the server', () => {
    const Button = styled('button')`
      color: red;
    `;
    const { html, css: out } = renderToString(() => jsx(Button, { type: 'submit', children: 'Go' }));
    expect(html).toMatch(/^<button data-hk="0" type="submit" class="v-[a-z0-9]+">Go<\/button>$/);
    expect(out).toContain('color: red');
  });

  it('context reaches function children of a Provider', () => {
    const Ctx = createContext('light');
    const Label = () => jsx('em', { children: useContext(Ctx) });
    const { html } = renderToString(() => jsx(Ctx.Provider, { value: 'dark', children: () => jsx(Label, {}) }));
    expect(html).toContain('>dark<');
  });

  it('maps htmlFor to for, and aria booleans to strings', () => {
    const { html } = renderToString(() => jsx('label', { htmlFor: 'x', 'aria-hidden': false }));
    expect(html).toBe('<label data-hk="0" for="x" aria-hidden="false"></label>');
  });

  it('Show branches render lazily inside a region', () => {
    const { html } = renderToString(() => jsx('div', { children: jsx(Show, { when: true, children: () => 'yes' }) }));
    expect(html).toBe('<div data-hk="0"><!--[-->yes<!--]--></div>');
  });

  it('renderToStream returns bytes usable as a Response body', async () => {
    const stream = renderToStream(() => jsx('p', { children: 'hi' }));
    const text = await new Response(stream).text();
    expect(text).toContain('<p data-hk="0">hi</p>');
  });
});
