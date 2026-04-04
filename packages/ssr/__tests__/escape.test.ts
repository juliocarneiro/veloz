import { describe, it, expect } from 'vitest';
import { escapeHTML, escapeAttr } from '../src/escape.js';

describe('escapeHTML', () => {
  it('should escape ampersands', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('should escape angle brackets', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHTML("it's")).toBe("it&#39;s");
  });

  it('should escape all special characters at once', () => {
    expect(escapeHTML('<a href="x">&</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'
    );
  });

  it('should return safe strings unchanged', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(escapeHTML('')).toBe('');
  });
});

describe('escapeAttr', () => {
  it('should escape attribute values', () => {
    expect(escapeAttr('a"b')).toBe('a&quot;b');
  });

  it('should escape single quotes in attributes', () => {
    expect(escapeAttr("it's")).toBe("it&#39;s");
  });

  it('should escape angle brackets in attributes', () => {
    expect(escapeAttr('<script>')).toBe('&lt;script&gt;');
  });
});
