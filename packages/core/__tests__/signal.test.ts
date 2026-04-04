import { describe, it, expect } from "vitest";
import { createSignal, batch, untrack, on } from "../src/signal.js";
import { createEffect } from "../src/effect.js";

describe("createSignal", () => {
  it("should return initial value", () => {
    const [count] = createSignal(0);
    expect(count()).toBe(0);
  });

  it("should update value with setter", () => {
    const [count, setCount] = createSignal(0);
    setCount(5);
    expect(count()).toBe(5);
  });

  it("should update value with function setter", () => {
    const [count, setCount] = createSignal(10);
    setCount((prev) => prev + 5);
    expect(count()).toBe(15);
  });

  it("should not notify if value is the same (Object.is)", () => {
    const [count, setCount] = createSignal(5);
    let effectCount = 0;

    createEffect(() => {
      count();
      effectCount++;
    });

    expect(effectCount).toBe(1);
    setCount(5);
    expect(effectCount).toBe(1);
  });

  it("should support custom equality function", () => {
    const [user, setUser] = createSignal(
      { name: "John", age: 30 },
      { equals: (a, b) => a.name === b.name && a.age === b.age },
    );
    let effectCount = 0;

    createEffect(() => {
      user();
      effectCount++;
    });

    expect(effectCount).toBe(1);
    setUser({ name: "John", age: 30 });
    expect(effectCount).toBe(1);

    setUser({ name: "Jane", age: 25 });
    expect(effectCount).toBe(2);
  });

  it("should support equals: false to always notify", () => {
    const [count, setCount] = createSignal(5, { equals: false });
    let effectCount = 0;

    createEffect(() => {
      count();
      effectCount++;
    });

    expect(effectCount).toBe(1);
    setCount(5);
    expect(effectCount).toBe(2);
  });

  it("should handle string signals", () => {
    const [name, setName] = createSignal("hello");
    expect(name()).toBe("hello");
    setName("world");
    expect(name()).toBe("world");
  });

  it("should handle undefined initial value", () => {
    const [value, setValue] = createSignal<string | undefined>(undefined);
    expect(value()).toBeUndefined();
    setValue("defined");
    expect(value()).toBe("defined");
  });
});

describe("batch", () => {
  it("should batch multiple updates into one effect run", () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    let effectCount = 0;

    createEffect(() => {
      a();
      b();
      effectCount++;
    });

    expect(effectCount).toBe(1);

    batch(() => {
      setA(1);
      setB(2);
    });

    expect(effectCount).toBe(2);
    expect(a()).toBe(1);
    expect(b()).toBe(2);
  });

  it("should allow reading current values inside batch", () => {
    const [count, setCount] = createSignal(0);

    batch(() => {
      setCount(5);
      expect(count()).toBe(5);
    });
  });
});

describe("untrack", () => {
  it("should read signal without creating dependency", () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    let effectCount = 0;

    createEffect(() => {
      a();
      untrack(() => b());
      effectCount++;
    });

    expect(effectCount).toBe(1);

    setA(1);
    expect(effectCount).toBe(2);

    setB(1);
    expect(effectCount).toBe(2);
  });
});

describe("on", () => {
  it("should track only specified dependencies", () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    let effectCount = 0;

    createEffect(
      on(a, () => {
        b();
        effectCount++;
      }),
    );

    expect(effectCount).toBe(1);
    setA(1);
    expect(effectCount).toBe(2);
    setB(1);
    expect(effectCount).toBe(2);
  });

  it("should support defer option", () => {
    const [count, setCount] = createSignal(0);
    let effectCount = 0;

    createEffect(
      on(
        count,
        () => {
          effectCount++;
        },
        { defer: true },
      ),
    );

    expect(effectCount).toBe(0);
    setCount(1);
    expect(effectCount).toBe(1);
  });

  it("should support array dependencies", () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    let values: number[][] = [];

    createEffect(
      on([a, b], (curr) => {
        values.push(curr as number[]);
      }),
    );

    expect(values.length).toBe(1);
    expect(values[0]).toEqual([0, 0]);

    setA(1);
    expect(values.length).toBe(2);
    expect(values[1]).toEqual([1, 0]);
  });
});
