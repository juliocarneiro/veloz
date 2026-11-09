# Changelog

## 0.1.0 (unreleased)

First public release, published under the `@velozjs` scope (`@velozjs/core`, `@velozjs/dom`, `@velozjs/css`, `@velozjs/ssr`) and `vite-plugin-veloz`.

### Reactivity (`@velozjs/core`)

- New scheduler: updates are batched and glitch-free (an effect never sees a stale memo and runs once per change), repeated reads subscribe once, and a memo that recomputes to the same value doesn't re-run its dependents.
- Computations are disposed with their owner, so effects inside a removed component, `Show` branch or `For` row stop running.
- An error in one effect no longer drops the other queued effects; effects that keep re-triggering each other throw instead of hanging.
- New: `createRoot`, `catchError`, `access` / `MaybeAccessor`, `SignalOptions`; `batch` returns its value; `on()` has typed overloads.
- `onMount` runs inside the component's owner (so `onCleanup` works in it) and is skipped if the component was disposed first.
- `isSafeURL`, `isSafeAttributeURL`, `isValidAttributeName` and `isValidTagName` are shared by the renderer, the sanitizer and SSR.

### Rendering (`@velozjs/dom`)

- Dynamic children are rendered as regions between two markers: arrays, nodes, text and nested functions all work, and content that grows later is always cleaned up.
- Component props are passed as they are: function props are no longer turned into getters and called.
- Functions returned by components keep their owner, so context and disposal follow the component tree.
- `For` is keyed by item identity: rows are kept and moved instead of recreated, `index` updates, removed rows are disposed.
- `Switch`/`Match` work on the first render; `Show` disposes the hidden branch; `ErrorBoundary` also catches errors from effects and no longer removes sibling elements; `Dynamic` renders on the first run.
- Events: non-bubbling events (`focus`, `blur`, `mouseenter`, `scroll`...) get direct listeners; bubbling ones are delegated with the right `currentTarget`, and also work inside `Portal`s and detached roots.
- SVG elements (`path`, `circle`, `g`...) are created in the SVG namespace.
- `ref` accepts `{ current }` objects; style objects remove properties that disappear; `aria-*` booleans render as `"true"`/`"false"`.
- Hydration indexes server elements once per container (no global `querySelector` per element) and matches dynamic text through region markers, so static text next to dynamic text is kept.

### Styles (`@velozjs/css`)

- `styled()` works in SSR (elements are created through the active runtime), and interpolations that read accessors update the class reactively.
- The `css` prop scopes nested selectors and `@media` blocks correctly; nested rules are no longer dropped when inserted into the stylesheet.
- SSR keeps every style registered in earlier renders (previously styles could go missing on the second request), and escapes `</style`.
- `sideEffects` now lists the entry, so `import '@velozjs/css'` is not tree-shaken away.

### SSR (`@velozjs/ssr`)

- Emits region markers that match the client and creates elements in the same order, so hydration reuses every element.
- Validates tag and attribute names, uses the shared URL check, and never prints `innerHTML`.
- `Portal` renders nothing on the server; `renderToStream` returns bytes usable as a `Response` body.

### Vite plugin

- Redirects `@velozjs/dom` to `@velozjs/ssr` during SSR through module resolution instead of text replacement: works in monorepos, with re-exports and dynamic imports. Removed the unused `hmr` option.

### Packaging

- ESM only, with shared chunks between entries (no duplicated runtime state), complete type declarations, and full npm metadata.

### Async data

- New `createResource(fetcher)` / `createResource(source, fetcher)`: async data as a signal, with `state`, `loading`, `error`, `latest`, `mutate` and `refetch`. Stale responses are ignored, a failed load throws on read (caught by `ErrorBoundary`), and results that arrive after disposal are dropped.
- `Suspense` now works: it shows its fallback while a resource read inside is loading for the first time, keeps the content on refetch, and keeps hidden content alive.
- New `renderToStringAsync`: waits for the data (in several passes for dependent requests), renders it into the HTML and returns a `<script>` (CSP nonce supported) that lets `hydrate()` reuse the values without fetching again.
