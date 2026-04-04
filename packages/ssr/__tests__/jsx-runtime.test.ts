import { describe, it, expect, beforeEach } from 'vitest';
import { jsx, Fragment } from '../src/jsx-runtime.js';
import { resetHydrationCounter } from '../src/hydration.js';

function html(result: unknown): string {
  if (result != null && typeof result === 'object' && 'value' in result) {
    return (result as { value: string }).value;
  }
  return String(result ?? '');
}

beforeEach(() => {
  resetHydrationCounter();
});

describe('server jsx', () => {
  it('should render a simple element', () => {
    const out = html(jsx('div', { children: 'hello' }));
    expect(out).toContain('<div');
    expect(out).toContain('data-hk="0"');
    expect(out).toContain('hello');
    expect(out).toContain('</div>');
  });

  it('should render nested elements', () => {
    const out = html(jsx('div', {
      children: jsx('span', { children: 'text' }),
    }));
    expect(out).toContain('<div');
    expect(out).toContain('<span');
    expect(out).toContain('text');
    expect(out).toContain('</span>');
    expect(out).toContain('</div>');
  });

  it('should render attributes', () => {
    const out = html(jsx('input', { type: 'text', placeholder: 'enter' }));
    expect(out).toContain('type="text"');
    expect(out).toContain('placeholder="enter"');
  });

  it('should render void elements without closing tag', () => {
    const out = html(jsx('br', {}));
    expect(out).toContain('<br');
    expect(out).not.toContain('</br>');
  });

  it('should render void input element', () => {
    const out = html(jsx('input', { type: 'text' }));
    expect(out).not.toContain('</input>');
  });

  it('should escape text children', () => {
    const out = html(jsx('div', { children: '<script>alert("xss")</script>' }));
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });

  it('should escape attribute values', () => {
    const out = html(jsx('div', { title: 'a"b' }));
    expect(out).toContain('title="a&quot;b"');
  });

  it('should skip event handlers', () => {
    const out = html(jsx('button', { onClick: () => {}, children: 'click' }));
    expect(out).not.toContain('onClick');
    expect(out).not.toContain('onclick');
  });

  it('should skip ref props', () => {
    const out = html(jsx('div', { ref: () => {}, children: 'test' }));
    expect(out).not.toContain('ref');
  });

  it('should render boolean attributes', () => {
    const out = html(jsx('input', { disabled: true, type: 'text' }));
    expect(out).toContain(' disabled');
  });

  it('should skip false/null attributes', () => {
    const out = html(jsx('input', { disabled: false, value: null }));
    expect(out).not.toContain('disabled');
    expect(out).not.toContain('value');
  });

  it('should render class attribute', () => {
    const out = html(jsx('div', { class: 'foo bar', children: 'x' }));
    expect(out).toContain('class="foo bar"');
  });

  it('should render style as string', () => {
    const out = html(jsx('div', { style: 'color:red', children: 'x' }));
    expect(out).toContain('style="color:red"');
  });

  it('should render style as object', () => {
    const out = html(jsx('div', {
      style: { color: 'red', fontSize: '14px' },
      children: 'x',
    }));
    expect(out).toContain('style="color:red;font-size:14px"');
  });

  it('should resolve reactive props (functions)', () => {
    const out = html(jsx('div', {
      class: () => 'dynamic-class',
      children: 'x',
    }));
    expect(out).toContain('class="dynamic-class"');
  });

  it('should render array children', () => {
    const out = html(jsx('ul', {
      children: [
        jsx('li', { children: 'a' }),
        jsx('li', { children: 'b' }),
      ],
    }));
    expect(out).toContain('<li');
    expect(out).toContain('a');
    expect(out).toContain('b');
  });

  it('should render function children (reactive)', () => {
    const out = html(jsx('span', { children: () => 42 }));
    expect(out).toContain('42');
  });

  it('should block dangerous URL schemes', () => {
    const out = html(jsx('a', { href: 'javascript:alert(1)', children: 'x' }));
    expect(out).not.toContain('javascript:');
  });

  it('should render components', () => {
    function MyComp(props: { name: string }) {
      return jsx('div', { children: `Hello ${props.name}` });
    }
    const out = html(jsx(MyComp, { name: 'World' }));
    expect(out).toContain('Hello World');
  });

  it('should assign incremental hydration keys', () => {
    const out = html(jsx('div', {
      children: [
        jsx('span', { children: 'a' }),
        jsx('span', { children: 'b' }),
      ],
    }));
    expect(out).toContain('data-hk="0"');
    expect(out).toContain('data-hk="1"');
    expect(out).toContain('data-hk="2"');
  });
});

describe('server Fragment', () => {
  it('should render children', () => {
    const out = html(Fragment({ children: [jsx('span', { children: 'a' }), jsx('span', { children: 'b' })] }));
    expect(out).toContain('<span');
    expect(out).toContain('a');
    expect(out).toContain('b');
  });

  it('should return empty string for null children', () => {
    expect(html(Fragment({ children: null }))).toBe('');
    expect(html(Fragment({}))).toBe('');
  });
});
