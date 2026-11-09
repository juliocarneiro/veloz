# @velozjs/core

Veloz's reactive core: signals, memos and effects with glitch-free, batched updates and ownership-based cleanup. No DOM required; runs in browsers, Node, workers and edge runtimes.

```bash
npm install @velozjs/core
```

```ts
import { createSignal, createMemo, createEffect, batch, onCleanup } from '@velozjs/core';

const [count, setCount] = createSignal(0);
const doubled = createMemo(() => count() * 2);

createEffect(() => {
  console.log(count(), doubled()); // runs now, then once per change
  onCleanup(() => {});             // before the next run and on dispose
});

batch(() => { setCount(1); setCount(2); }); // one effect run
```

API: `createSignal`, `createMemo`, `createResource` (async data), `createEffect`, `createRenderEffect`, `createRoot`, `batch`, `untrack`, `on`, `onMount`, `onCleanup`, `createContext`, `useContext`, `catchError`, `access`, `getCurrentOwner`, `runWithOwner`.

Documentation and the other packages: [github.com/juliocarneiro/veloz](https://github.com/juliocarneiro/veloz). MIT license.
