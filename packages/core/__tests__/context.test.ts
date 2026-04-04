import { describe, it, expect } from 'vitest';
import { createContext, useContext } from '../src/context.js';
import { createOwner, setCurrentOwner } from '../src/reactive.js';

describe('createContext / useContext', () => {
  it('should provide and consume context values', () => {
    const ThemeCtx = createContext('light');

    const owner = createOwner();
    const prev = setCurrentOwner(owner);

    ThemeCtx.Provider({ value: 'dark', children: null });

    const childOwner = createOwner();
    setCurrentOwner(childOwner);

    const theme = useContext(ThemeCtx);
    expect(theme).toBe('dark');

    setCurrentOwner(prev);
  });

  it('should return default value when no provider', () => {
    const CountCtx = createContext(42);

    const owner = createOwner();
    const prev = setCurrentOwner(owner);

    const count = useContext(CountCtx);
    expect(count).toBe(42);

    setCurrentOwner(prev);
  });

  it('should throw when no provider and no default', () => {
    const Ctx = createContext<string>();

    const owner = createOwner();
    const prev = setCurrentOwner(owner);

    expect(() => useContext(Ctx)).toThrow('[Veloz] useContext');

    setCurrentOwner(prev);
  });

  it('should use nearest provider value', () => {
    const Ctx = createContext('root');

    const owner = createOwner();
    const prev = setCurrentOwner(owner);
    Ctx.Provider({ value: 'outer', children: null });

    const child = createOwner();
    setCurrentOwner(child);
    Ctx.Provider({ value: 'inner', children: null });

    const grandchild = createOwner();
    setCurrentOwner(grandchild);

    const value = useContext(Ctx);
    expect(value).toBe('inner');

    setCurrentOwner(prev);
  });
});
