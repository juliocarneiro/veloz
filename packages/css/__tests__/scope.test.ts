import { describe, it, expect } from 'vitest';
import { scopeCSS } from '../src/css';
import { objectToScopedCSS } from '../src/object-to-css';

const flat = (s: string) => s.replace(/\s+/g, ' ').replace(/\s*([{};:,])\s*/g, '$1').trim();

describe('scopeCSS', () => {
  it('scopes bare declarations, & rules and descendant rules', () => {
    const out = scopeCSS(
      `
      padding: 1rem;
      &:hover { color: red; }
      .title { font-weight: 600; }
      & > a, button { color: blue; }
    `,
      'v-x'
    );
    expect(flat(out)).toBe(
      flat('.v-x{padding:1rem;}.v-x:hover{color:red;}.v-x .title{font-weight:600;}.v-x > a, .v-x button{color:blue;}')
    );
  });

  it('scopes declarations and rules inside @media / @supports / @container', () => {
    const out = scopeCSS(`@media (min-width: 40em) { padding: 2rem; .title { font-size: 2rem; } }`, 'v-x');
    expect(flat(out)).toBe(flat('@media (min-width: 40em){.v-x{padding:2rem;}.v-x .title{font-size:2rem;}}'));
  });

  it('keeps @keyframes and @font-face as they are', () => {
    const out = scopeCSS(`animation: spin 1s; @keyframes spin { from { rotate: 0deg } to { rotate: 360deg } }`, 'v-x');
    expect(flat(out)).toBe(flat('.v-x{animation:spin 1s;}@keyframes spin{from { rotate: 0deg } to { rotate: 360deg }}'));
  });

  it('handles nesting several levels deep and ignores comments and braces in strings', () => {
    const out = scopeCSS(`/* note { */ .card { &:hover { .icon { content: "}"; } } }`, 'v-x');
    expect(flat(out)).toBe(flat('.v-x .card:hover .icon{content:"}";}'));
  });

  it('a nested rule never leaks out unscoped', () => {
    const out = scopeCSS(`h1 { color: red; }`, 'v-x');
    expect(out.startsWith('.v-x ')).toBe(true);
  });
});

describe('objectToScopedCSS', () => {
  it('adds px to numbers and keeps unitless values', () => {
    expect(objectToScopedCSS({ padding: 8, opacity: 0.4, fontWeight: 600 }, '.v')).toBe('.v{padding:8px;opacity:0.4;font-weight:600;}');
  });

  it('keeps @keyframes unscoped', () => {
    const out = objectToScopedCSS({ '@keyframes pulse': { from: { opacity: 0 }, to: { opacity: 1 } } }, '.v');
    expect(out).toBe('@keyframes pulse{from{opacity:0;}to{opacity:1;}}');
  });

  it('expands comma-separated nested selectors', () => {
    expect(objectToScopedCSS({ '&:hover, &:focus-visible': { color: 'red' } }, '.v')).toBe('.v:hover, .v:focus-visible{color:red;}');
  });
});
