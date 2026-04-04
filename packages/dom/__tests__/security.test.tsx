import { describe, it, expect, vi } from 'vitest';
import { sanitize } from '../src/sanitizer';
import { validateAttribute, sanitizeURL } from '../src/security';
import { createElement } from '../src/jsx-runtime';
import { validateKey } from '@veloz/core';

describe('XSS Prevention', () => {
  it('should escape text content by default (no innerHTML)', () => {
    const el = createElement('div', null, '<script>alert(1)</script>') as HTMLElement;
    expect(el.innerHTML).not.toContain('<script>');
    expect(el.textContent).toBe('<script>alert(1)</script>');
  });

  it('should escape reactive text content', () => {
    const el = createElement('div', null, () => '<img onerror=alert(1) src=x>') as HTMLElement;
    document.body.appendChild(el);
    expect(el.innerHTML).not.toContain('<img');
    document.body.removeChild(el);
  });
});

describe('HTML Sanitizer', () => {
  it('should strip script tags', () => {
    const result = sanitize('<p>Hello</p><script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('should strip event handler attributes', () => {
    const result = sanitize('<div onload="alert(1)" onclick="alert(2)">test</div>');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('onclick');
    expect(result).toContain('test');
  });

  it('should sanitize javascript: URLs', () => {
    const result = sanitize('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('about:blank');
  });

  it('should allow safe tags and attributes', () => {
    const html = '<p class="text"><strong>bold</strong> and <em>italic</em></p>';
    const result = sanitize(html);
    expect(result).toContain('<p');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should strip iframe tags', () => {
    const result = sanitize('<iframe src="https://evil.com"></iframe><p>safe</p>');
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>safe</p>');
  });

  it('should strip form tags', () => {
    const result = sanitize('<form action="https://evil.com"><input type="password"></form>');
    expect(result).not.toContain('<form');
  });

  it('should strip object/embed tags', () => {
    const result = sanitize('<object data="evil.swf"></object><embed src="evil.swf">');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });

  it('should add noopener noreferrer to links', () => {
    const result = sanitize('<a href="https://example.com">link</a>');
    expect(result).toContain('noopener noreferrer');
  });

  it('should strip HTML comments', () => {
    const result = sanitize('<!-- comment --><p>visible</p>');
    expect(result).not.toContain('<!--');
    expect(result).toContain('<p>visible</p>');
  });

  it('should handle data: image URLs safely', () => {
    const safeImg = '<img src="data:image/png;base64,abc123">';
    const result = sanitize(safeImg);
    expect(result).toContain('data:image/png;base64,abc123');
  });

  it('should block data: non-image URLs', () => {
    const evilImg = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitize(evilImg);
    expect(result).toContain('about:blank');
  });
});

describe('Attribute Validation', () => {
  it('should block string event handlers', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateAttribute('onclick', 'alert(1)')).toBe(false);
    expect(validateAttribute('onload', 'doEvil()')).toBe(false);
    spy.mockRestore();
  });

  it('should allow function event handlers', () => {
    expect(validateAttribute('onclick', () => {})).toBe(true);
  });

  it('should block javascript: URLs in href', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateAttribute('href', 'javascript:alert(1)')).toBe(false);
    expect(validateAttribute('src', 'javascript:void(0)')).toBe(false);
    spy.mockRestore();
  });

  it('should allow safe URLs', () => {
    expect(validateAttribute('href', 'https://example.com')).toBe(true);
    expect(validateAttribute('src', '/images/logo.png')).toBe(true);
    expect(validateAttribute('href', '#anchor')).toBe(true);
  });

  it('should block vbscript: URLs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateAttribute('href', 'vbscript:alert(1)')).toBe(false);
    spy.mockRestore();
  });
});

describe('URL Sanitization', () => {
  it('should replace javascript: with about:blank', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('about:blank');
  });

  it('should replace data: with about:blank', () => {
    expect(sanitizeURL('data:text/html,evil')).toBe('about:blank');
  });

  it('should pass through safe URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('/relative/path')).toBe('/relative/path');
  });

  it('should trim whitespace before checking', () => {
    expect(sanitizeURL('  javascript:alert(1)  ')).toBe('about:blank');
  });
});

describe('Prototype Pollution Protection', () => {
  it('should block __proto__ key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateKey('__proto__')).toBe(false);
    spy.mockRestore();
  });

  it('should block constructor key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateKey('constructor')).toBe(false);
    spy.mockRestore();
  });

  it('should block prototype key', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateKey('prototype')).toBe(false);
    spy.mockRestore();
  });

  it('should allow normal keys', () => {
    expect(validateKey('name')).toBe(true);
    expect(validateKey('value')).toBe(true);
    expect(validateKey(Symbol('test'))).toBe(true);
  });
});

describe('CSP Compliance', () => {
  it('should use textContent for text insertion (never innerHTML)', () => {
    const el = createElement('div', null, 'safe text') as HTMLElement;
    expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });

  it('should use style.setProperty for dynamic styles (CSP-safe)', () => {
    const el = createElement('div', {
      style: { backgroundColor: 'red' }
    }) as HTMLElement;
    expect(el.style.backgroundColor).toBe('red');
  });
});
