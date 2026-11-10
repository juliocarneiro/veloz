# Changelog

## create-veloz 0.1.2

Generated projects are organized by role instead of keeping everything flat in `src/`:

- `src/components/` for components, `src/styles/global.css` for styles and, in the `ssr` template, `src/lib/quotes.ts` for the data source.
- The `ssr` server moved from `server.js` at the root to `server/index.js`, so the root only holds configuration (`index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`).
- The `app` template imports its CSS from `src/main.tsx`, the usual Vite setup. The `ssr` template keeps the `<link>` in `index.html`, so server-rendered pages are styled before any JavaScript runs.
- Each template README shows the folder layout.

## 0.1.2

Found while moving the salve-css site to Veloz.

### Server rendering

- `@velozjs/ssr` now exports everything `@velozjs/dom` does. During SSR the Vite plugin points `@velozjs/dom` imports at `@velozjs/ssr`, so a name missing there broke the server bundle at load time, even if it was never called:
  - `createElement`, so JSX-free code (`createElement as h`) renders on the server and hydrates in the browser.
  - `sanitizeURL`, `validateAttribute` and `isExternalURL`, with the same checks as in the browser.
  - `toNodes`, `setupDelegation`, `setEventHandler` and `registerCssPropHandler` as server stubs (`toNodes` explains that it needs the DOM).
- A test now fails if the two packages' exports drift apart again.

### Types

- Numeric attributes accept numeric strings, as in HTML: `<progress value="64">`, `<td colspan="2">`, `<textarea rows="4">`, `maxlength`, `size`, `<ol start>` and `<meter>` values. Non-numeric strings (`value="lots"`) are still an error.

### Packages

- The npm `homepage` of every package points to the documentation site.

## create-veloz 0.1.1

New package: `npm create veloz@latest` creates a project that is ready to run, with Vite, TypeScript and the plugin configured.

- Templates: `app` (single-page app) and `ssr` (server rendering, hydration and async data, with a Node server for dev and production).
- Asks for the name and template, installs with the package manager that ran it (npm, pnpm, yarn or bun) and prints the next commands. `--template`, `--install` and `--no-install` skip the prompts; outside a terminal it never asks.
- No dependencies. The template code is type-checked in this repository on every `pnpm typecheck`.

## 0.1.1

Fixes found while building a real site with 0.1.0. Upgrading is recommended for everyone.

### Vite plugin

- SSR now works when the packages come from `node_modules`: `@velozjs/dom` and `@velozjs/ssr` are no longer externalized, so app imports are redirected and a single copy of the SSR runtime is used. (In 0.1.0 this only worked with linked workspace packages.)
- Vite 8 support: JSX is configured through `oxc` on Vite 8 and `esbuild` on older versions, based on the Vite that is running (`this.meta.viteVersion`), not on whichever `vite` copy the plugin happens to import.

### Server rendering

- `createEffect` and `onMount` no longer run during SSR, so browser-only code inside them can't crash the server.
- A `renderToString` call nested inside another (e.g. islands rendered as separate roots) no longer resets the outer render's hydration and resource keys.
- Internal markers use `Symbol.for`, so duplicated module copies still understand each other.

### Rendering

- `value`, `checked`, `selected` and `indeterminate` on form elements are applied after the other attributes and the children: `<select value>` selects an option rendered inside it, and `<input type="range" value>` isn't clamped when `value` is written before `min`/`max`.
- Numbers in style objects get `px` (except unitless properties like `opacity`, `zIndex`, `lineHeight`), in the browser and in SSR.

### Styles

- `` css`...` `` scopes every nested rule: a rule without `&` is now a descendant of the class instead of leaking out as global CSS; bare declarations inside `@media`/`@supports`/`@container` are scoped; `@keyframes` and `@font-face` are kept as written; comments and braces inside strings are handled.
- The `css` prop expands comma-separated nested selectors, adds `px` to numbers and keeps `@keyframes` unscoped.

### Types

- Each intrinsic element knows its DOM type: `ref` receives `HTMLDialogElement` on `<dialog>`, and event handlers get a typed `currentTarget` (`e.currentTarget.value` on an `<input>` needs no cast).
- Every attribute accepts a value or an accessor, and SVG elements have their own attribute types.
- `JSX.ElementType` (TypeScript 5.1+) separates what a component may return from the type of a JSX expression, so render-function children (`<Show>{(user) => ...}</Show>`, `<Match>`, `ErrorBoundary` fallbacks) get typed parameters.
- `Dynamic` returns `JSX.Element`; new exported types: `DOMAttributes`, `EventHandler`, `TargetedEvent`, `Ref`, `StaticElement`.
- `typesVersions` for `@velozjs/dom/jsx-runtime` and `@velozjs/ssr/jsx-runtime`, for projects using `moduleResolution: "node"`.
- A compile-time test suite (`type-tests/`) now runs with `pnpm typecheck`.

## 0.1.0

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
