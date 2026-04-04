import { describe, it, expect } from 'vitest';
import { hash } from '../src/hash';

describe('hash', () => {
  it('returns a string prefixed with v-', () => {
    const result = hash('color:red;');
    expect(result).toMatch(/^v-[a-z0-9]+$/);
  });

  it('produces deterministic output', () => {
    const a = hash('padding:1rem;background:blue;');
    const b = hash('padding:1rem;background:blue;');
    expect(a).toBe(b);
  });

  it('produces different hashes for different input', () => {
    const a = hash('color:red;');
    const b = hash('color:blue;');
    expect(a).not.toBe(b);
  });

  it('handles empty string', () => {
    const result = hash('');
    expect(result).toMatch(/^v-[a-z0-9]+$/);
  });

  it('handles long strings', () => {
    const long = 'a'.repeat(10000);
    const result = hash(long);
    expect(result).toMatch(/^v-[a-z0-9]+$/);
  });
});
