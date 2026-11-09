# Veloz

**Fine-grained reactive UI with JSX. No virtual DOM, no re-renders: signals update the exact DOM nodes that depend on them.**

**[Documentation](https://veloz-site.vercel.app)** · [Português](README.pt-BR.md)

- **Signals, memos and effects** with glitch-free, batched updates and automatic cleanup.
- **Components run once.** JSX creates real DOM nodes; reactivity lives in the functions you pass.
- **SSR and hydration**: `renderToString` on the server, `hydrate` on the client, same components.
- **Scoped CSS-in-JS**: `css`, `styled` and the `css` prop. CSP-friendly, collected during SSR.
- **Secure by default**: text is never parsed as HTML, URLs and attribute names are validated, `innerHTML` is sanitized.
- **TypeScript-first**, ESM-only, no runtime dependencies.

## Packages

| Package | What it does |
| --- | --- |
| [`@velozjs/core`](packages/core) | Signals, memos, effects, ownership, context. Works anywhere (no DOM). |
| [`@velozjs/dom`](packages/dom) | JSX runtime, `render`, `hydrate`, `Show`, `For`, `Switch`, `ErrorBoundary`, `Portal`, sanitizer. |
| [`@velozjs/css`](packages/css) | `css`, `styled`, the `css` prop, SSR style collection. |
| [`@velozjs/ssr`](packages/ssr) | `renderToString`, `renderToStream`, server versions of the components. |
| [`vite-plugin-veloz`](packages/vite-plugin) | JSX setup and SSR module resolution for Vite. |

## Quick start

```bash
npm install @velozjs/dom @velozjs/css
npm install -D vite vite-plugin-veloz typescript
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import veloz from 'vite-plugin-veloz';

export default defineConfig({ plugins: [veloz()] });
```

```json
// tsconfig.json (compilerOptions)
{ "jsx": "react-jsx", "jsxImportSource": "@velozjs/dom" }
```

Requirements: Node 20+, Vite 5 or newer (Vite 8 included), TypeScript 5.1+ if you use TypeScript.

```tsx
// src/main.tsx
import { render, createSignal, createMemo, Show } from '@velozjs/dom';
import '@velozjs/css';

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  return (
    <div css={{ display: 'grid', gap: '0.5rem', placeItems: 'center' }}>
      <p>Count: {count} · doubled: {doubled}</p>
      <button onClick={() => setCount((c) => c + 1)}>Add one</button>
      <Show when={() => count() >= 10}>
        <p>That's a lot of clicks.</p>
      </Show>
    </div>
  );
}

render(() => <Counter />, document.getElementById('app')!);
```

`{count}` works because a getter is a function: any function in JSX becomes a live region that updates when the signals it reads change.

## The mental model

A Veloz component is a plain function that **runs once** and returns DOM nodes. Nothing re-runs on its own. What changes are the **functions** you put in JSX:

```tsx
<p class={() => (done() ? 'done' : '')}>   {/* reactive attribute */}
  {() => `${left()} items left`}           {/* reactive text */}
</p>
```

Three rules cover almost everything:

1. **Read signals inside functions** (`{() => a() + b()}`, `class={() => ...}`), not in the component body, if you want updates.
2. **Props are passed as they are.** A function prop stays a function, so callbacks and render props just work. To accept a value *or* a signal, type it as `MaybeAccessor<T>` and read it with `access(props.x)`.
3. **Pass a function to render lazily.** JSX children are created before their parent runs. Write `{() => <Heavy />}` when the content should be created only when shown, or inside a `Provider` / `ErrorBoundary` scope.

## Reactivity

```ts
import { createSignal, createMemo, createEffect, batch, untrack, on, onCleanup } from '@velozjs/core';

const [first, setFirst] = createSignal('Ada');
const [last, setLast] = createSignal('Lovelace');
const full = createMemo(() => `${first()} ${last()}`); // cached, recomputes only when needed

createEffect(() => {
  document.title = full();
  const id = setInterval(() => {}, 1000);
  onCleanup(() => clearInterval(id)); // runs before the next run and on dispose
});

batch(() => { setFirst('Grace'); setLast('Hopper'); }); // effects run once
untrack(() => full());                                   // read without subscribing
createEffect(on(first, (value, prev) => console.log(prev, '→', value), { defer: true }));
```

Updates are **glitch-free**: an effect never sees a memo that is out of date, and runs once per change even when several of its sources change together. Effects created inside a component (or inside a `Show` branch, a `For` row...) are **disposed with it**.

Also available: `createResource` (see [Async data](#async-data)), `createRoot(dispose => ...)` for scopes you dispose yourself, `catchError(fn, handler)`, `createContext` / `useContext`, `onMount`.

## Async data

`createResource` turns a promise into a signal. Wrap the part that reads it in `<Suspense>` to show a fallback while it loads, and in `<ErrorBoundary>` to handle failures.

```tsx
import { createResource, createSignal, Suspense, ErrorBoundary } from '@velozjs/dom';

function Post(props: { id: () => number }) {
  // Refetches whenever props.id() changes; stale responses are ignored.
  const [post, { refetch }] = createResource(props.id, (id) =>
    fetch(`/api/posts/${id}`).then((r) => r.json())
  );

  return (
    <article>
      <h2>{() => post()?.title}</h2>
      <button onClick={() => refetch()} disabled={() => post.loading}>Reload</button>
    </article>
  );
}

function Page() {
  const [id, setId] = createSignal(1);
  return (
    <ErrorBoundary fallback={(err, reset) => <p>{err.message} <button onClick={reset}>Retry</button></p>}>
      {() => (
        <Suspense fallback={<p>Loading...</p>}>
          {() => <Post id={id} />}
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
```

- `post()` is the value (undefined until the first load); `post.state` is `unresolved`, `pending`, `ready`, `refreshing` or `errored`; `post.loading`, `post.error` and `post.latest` are reactive too.
- `Suspense` shows the fallback while a resource read inside is loading **for the first time**. Refetches keep the current content on screen (use `post.loading` for a spinner). The content is created once and stays alive while hidden.
- A failed load throws when read, so the nearest `ErrorBoundary` shows its fallback.
- Without a source, the fetcher runs once. With a source (`createResource(source, fetcher)`), it runs again when the source changes, and not while it is `false`, `null` or `undefined`.
- `mutate(value)` sets the value locally (optimistic updates); `refetch()` loads again.

On the server, `renderToStringAsync` waits for the data (see [Server-side rendering](#server-side-rendering)), so the HTML already contains it and the client does not fetch again.

## Control flow

```tsx
<Show when={() => user()} fallback={<SignIn />}>
  {(u) => <Dashboard user={u} />}
</Show>

<For each={() => todos()} fallback={<p>Nothing to do</p>}>
  {(todo, index) => <li>{() => index() + 1}. {todo.title}</li>}
</For>

<Switch fallback={<NotFound />}>
  <Match when={() => route() === 'home'}><Home /></Match>
  <Match when={() => route() === 'about'}><About /></Match>
</Switch>

<ErrorBoundary fallback={(err, reset) => <button onClick={reset}>{err.message}: retry</button>}>
  {() => <Widget />}
</ErrorBoundary>

<Portal mount={document.body}>{() => <Modal />}</Portal>

<Dynamic component={level === 1 ? 'h1' : 'h2'}>Title</Dynamic>
```

- `For` is **keyed by item identity**: existing rows (their DOM, focus and state) are kept and moved, only new items render, removed rows are disposed.
- `ErrorBoundary` catches errors thrown while rendering its children **and in effects they create later**.
- `Portal` content receives events normally.

## Styling

```tsx
import { css, styled } from '@velozjs/css';

const card = css`
  padding: 1.5rem;
  border-radius: 12px;
  &:hover { box-shadow: 0 4px 12px rgb(0 0 0 / 0.1); }
  .title { font-weight: 600; }          /* descendant: .v-xyz .title */
  @media (min-width: 40em) { padding: 2rem; }
`;

const Button = styled('button')`
  padding: 0.5rem 1rem;
  background: ${(p: { tone?: string }) => (p.tone === 'danger' ? 'crimson' : 'royalblue')};
`;

<div class={card}>
  <Button tone="danger" onClick={remove}>Delete</Button>
  <span css={{ color: 'gray', '&:hover': { color: 'black' }, '@media (min-width: 40em)': { fontSize: '1.25rem' } }}>
    hint
  </span>
</div>
```

Nested rules are always scoped: `&` marks where the class goes, and a rule without `&` applies to descendants. `@media`, `@supports` and `@container` scope their contents; `@keyframes` and `@font-face` are kept as written. In style objects (`style`, `css`), numbers get `px` except for unitless properties such as `opacity`, `zIndex` and `lineHeight`.

Class names are content hashes (`v-1x2y3z`). Styles go to a constructable stylesheet (no inline `<style>` writes, CSP-friendly) and are deduplicated. Import `@velozjs/css` once in your client entry: that import enables the `css` prop.

Prefer a plain stylesheet? Veloz works with any CSS, including utility or class-based libraries.

## Server-side rendering

```tsx
// entry-server.tsx
import { renderToString } from '@velozjs/ssr';
import { App } from './App';

export function render(url: string) {
  return renderToString(() => <App url={url} />); // { html, css }
}
```

```ts
// server: put the result in your HTML shell
const { html, css } = render(req.url);
res.end(template
  .replace('<!--ssr-css-->', `<style data-veloz-css>${css}</style>`)
  .replace('<!--ssr-outlet-->', html));
```

```tsx
// entry-client.tsx
import { hydrate } from '@velozjs/dom';
import '@velozjs/css';
import { App } from './App';

hydrate(() => <App url={location.pathname} />, document.getElementById('app')!);
```

### With async data

`renderToString` is synchronous: resources that are still loading render their `Suspense` fallback. To send the page with the data in it, use `renderToStringAsync`:

```ts
import { renderToStringAsync } from '@velozjs/ssr';

const { html, css, script } = await renderToStringAsync(() => <App url={req.url} />, { timeout: 5000 });
res.end(template
  .replace('<!--ssr-css-->', `<style data-veloz-css>${css}</style>`)
  .replace('<!--ssr-outlet-->', html + script)); // the script must run before your client entry
```

It renders, waits for the pending fetches, and renders again with their values (repeating when one request depends on another). `script` hands the values to `hydrate()`, which starts every resource from them instead of fetching. Values must be JSON-serializable; failed loads are sent as their error message. Options: `timeout` (ms), `maxPasses` (default 10) and `nonce` for a CSP.

Resources are matched between server and client by creation order. If a component creates resources conditionally in a way that differs between the two, give them a stable `name`: `createResource(fetcher, { name: 'user' })`.

### How it fits together

- With `vite-plugin-veloz`, app imports of `@velozjs/dom` resolve to `@velozjs/ssr` during SSR (dev and `vite build --ssr`), so components are shared as is.
- The server tags elements with `data-hk` keys and wraps dynamic regions in `<!--[-->…<!--]-->` comments. `hydrate()` reuses those elements, attaches events and effects, and removes the keys.
- Styles from `css`, `styled` and the `css` prop are collected on the server; the client detects them and does not inject them again.
- `renderToStream()` returns a byte stream (styles first) you can pass to `new Response()`. Like `renderToString`, it does not wait for data.
- `createEffect` and `onMount` don't run on the server (they're for browser side effects), so code inside them can use `window` and `document` freely. Memos and resources do run.
- On the server, `innerHTML` is not printed (there is no DOM sanitizer there); the client sets it, sanitized, during hydration. `Portal` content is client-only.

See [`examples/ssr`](examples/ssr) for a complete dev server.

## Security

- Text is always inserted as text (`createTextNode`), never parsed as HTML.
- `innerHTML` goes through an allowlist sanitizer (with Trusted Types when available).
- URLs in `href`, `src`, `action`, `formaction`, `srcset`... are checked after the same normalization browsers apply, so `java\tscript:` and similar tricks are blocked. `data:` is allowed only for raster images in `src`.
- Attribute names that could break out of the tag (spaces, quotes, `=`...) are rejected, on the client and in SSR.
- String event handlers (`onclick="..."`) are rejected; handlers are functions stored off the DOM.
- No `eval`, `new Function` or inline scripts. Server CSS cannot close its `<style>` tag.

Details in [SECURITY.md](SECURITY.md).

## Without a bundler plugin

`@velozjs/dom` also exports `createElement(tag, props, ...children)`, so you can use it with any JSX setup (`jsxFactory`) or without JSX.

## Development

```bash
pnpm install
pnpm test        # vitest (core, dom, css, ssr, vite-plugin)
pnpm typecheck
pnpm build
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Release notes are in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Julio Carneiro
