import { describe, it, expect, beforeEach } from 'vitest';
import { insertCSS, getSSRStyles, resetSSRStyles } from '@veloz/css';

beforeEach(() => {
  resetSSRStyles();
});

describe('SSR CSS collection', () => {
  it('should collect CSS on the server', () => {
    insertCSS('test-1', '.v-abc{color:red}');
    const styles = getSSRStyles();
    expect(styles).toContain('.v-abc{color:red}');
  });

  it('should collect multiple CSS rules', () => {
    insertCSS('test-a', '.v-a{color:red}');
    insertCSS('test-b', '.v-b{color:blue}');
    const styles = getSSRStyles();
    expect(styles).toContain('.v-a{color:red}');
    expect(styles).toContain('.v-b{color:blue}');
  });

  it('should deduplicate CSS by ID', () => {
    insertCSS('dup', '.v-dup{margin:0}');
    insertCSS('dup', '.v-dup{margin:0}');
    const styles = getSSRStyles();
    const count = styles.split('.v-dup').length - 1;
    expect(count).toBe(1);
  });

  it('should reset per-render buffer but keep permanent map', () => {
    insertCSS('reset-test', '.v-x{padding:0}');
    expect(getSSRStyles()).toContain('.v-x');
    resetSSRStyles();
    expect(getSSRStyles()).toContain('.v-x');
  });

  it('should return cached CSS after reset (modules stay loaded)', () => {
    insertCSS('cached-1', '.v-cached{font-size:1rem}');
    resetSSRStyles();
    const styles = getSSRStyles();
    expect(styles).toContain('.v-cached');
  });
});
