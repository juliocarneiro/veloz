import { createMemo, createSignal, Show } from '@velozjs/dom';

export function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  // This function runs once. Only the text nodes that read count() update.
  return (
    <section class="card">
      <div class="count">{count}</div>
      <p>doubled: {doubled}</p>
      <div class="row">
        <button onClick={() => setCount((c) => c - 1)}>−1</button>
        <button class="primary" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
      </div>
      <Show when={() => count() >= 10}>
        <p>That's a lot of clicks.</p>
      </Show>
    </section>
  );
}
