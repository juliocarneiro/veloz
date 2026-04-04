# Veloz.js

**A blazing fast reactive frontend framework with fine-grained reactivity.**

No Virtual DOM. No diffing. Just surgical DOM updates powered by Signals.

---

## Features

- **Fine-grained Reactivity** - Updates only what changed, nothing more
- **Signals** - Simple `[getter, setter]` reactive primitives
- **JSX/TSX** - Write native JSX that compiles to real DOM operations
- **Components run once** - No re-renders, no reconciliation
- **CSS-in-JS** - Built-in `css`, `styled`, and `css` prop with automatic scoping
- **Secure by default** - Built-in XSS prevention, HTML sanitization, CSP-compatible
- **TypeScript-first** - Written 100% in TypeScript with full generic types
- **Tiny bundle** - Zero runtime overhead from Virtual DOM diffing
- **Trusted Types** - Native browser API integration for maximum XSS protection
- **Server-Side Rendering** - Built-in SSR with `renderToString`, streaming, and automatic hydration

## Quick Start

```bash
# Create a new project
mkdir my-app && cd my-app
npm init -y
npm install @veloz/core @veloz/dom @veloz/css @veloz/ssr
npm install -D vite vite-plugin-veloz typescript
```

**vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import veloz from 'vite-plugin-veloz';

export default defineConfig({
  plugins: [veloz()],
});
```

**src/App.tsx**

```tsx
import { createSignal, createMemo } from '@veloz/dom';
import { Show } from '@veloz/dom';
import { css, styled } from '@veloz/css';

const container = css`
  text-align: center;
  padding: 3rem;
`;

const Count = styled('div')`
  font-size: 4rem;
  font-weight: bold;
  margin: 1rem 0;
`;

const Button = styled('button')`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #6c63ff;
  color: #fff;
  cursor: pointer;
  &:hover { background: #5a52d5; }
  &:active { transform: scale(0.95); }
`;

export function App() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  return (
    <div class={container}>
      <h1>Veloz.js</h1>
      <Count>{() => String(count())}</Count>
      <p>Doubled: {() => String(doubled())}</p>
      <div css={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button onClick={() => setCount(c => c - 1)}>- 1</Button>
        <Button onClick={() => setCount(c => c + 1)}>+ 1</Button>
        <Button onClick={() => setCount(0)}>Reset</Button>
      </div>
      <Show when={() => count() > 10}>
        <p>Count is over 10!</p>
      </Show>
    </div>
  );
}
```

**src/main.tsx**

```tsx
import { render } from '@veloz/dom';
import '@veloz/css';
import { App } from './App';

render(() => <App />, document.getElementById('app')!);
```

## CSS-in-JS Module (`@veloz/css`)

Veloz.js includes a built-in CSS module with **3 APIs** and **automatic scoping** per component. All styles are CSP-compatible (injected via `CSSStyleSheet` API, no `eval` or inline scripts).

### 1. `css` Tagged Template

Returns a scoped class name. Supports nesting with `&`.

```tsx
import { css } from '@veloz/css';

const card = css`
  padding: 2rem;
  border-radius: 8px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  & .title {
    font-size: 1.5rem;
  }
`;

<div class={card}>
  <h2>Hello</h2>
</div>
```

### 2. `styled` Components

Creates styled Veloz components with dynamic props.

```tsx
import { styled } from '@veloz/css';

const Button = styled('button')`
  padding: 8px 16px;
  background: ${(props) => props.primary ? '#6c63ff' : '#888'};
  color: white;
  border: none;
  border-radius: 4px;
  
  &:hover { opacity: 0.9; }
  &:active { transform: scale(0.97); }
`;

<Button primary onClick={handleClick}>Save</Button>
<Button>Cancel</Button>
```

### 3. `css` Prop

Inline styles as an object, automatically scoped.

```tsx
<div css={{
  display: 'flex',
  gap: '1rem',
  backgroundColor: '#f0f0f0',
  '&:hover': { background: '#e0e0e0' }
}}>
  Content
</div>
```

### How It Works

- CSS strings are hashed to a unique class name (e.g. `v-k7x2m`)
- `&` is replaced with the scoped class selector
- Styles are injected via `CSSStyleSheet` + `adoptedStyleSheets` (CSP-safe)
- Duplicate styles are deduplicated automatically
- `camelCase` props are converted to `kebab-case`
- During SSR, styles are collected server-side and returned as a string for inline `<style>` injection
- On the client after SSR, existing `<style data-veloz-css>` tags are auto-detected so styles are never duplicated or re-injected

## Server-Side Rendering (`@veloz/ssr`)

Veloz.js supports full server-side rendering for SEO, social sharing, and faster first paint. The SSR system collects CSS automatically during rendering, so styles are included inline in the initial HTML -- no flash of unstyled content.

### Basic SSR

**server.ts**

```typescript
import { renderToString } from '@veloz/ssr';
import App from './App';

app.get('*', (req, res) => {
  const { html, css } = renderToString(() => <App url={req.url} />);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style data-veloz-css>${css}</style>
    </head>
    <body>
      <div id="app">${html}</div>
      <script type="module" src="/src/entry-client.tsx"></script>
    </body>
    </html>
  `);
});
```

**entry-client.tsx**

```typescript
import { hydrate } from '@veloz/dom';
import '@veloz/css';
import App from './App';

hydrate(() => <App />, document.getElementById('app')!);
```

### Streaming SSR

```typescript
import { renderToStream } from '@veloz/ssr';

const stream = renderToStream(() => <App />);
// Pipe to HTTP response for faster TTFB
```

### CSS in SSR

All three CSS APIs (`css`, `styled`, `css` prop) work automatically during SSR. Styles are collected and returned as a string -- inject them in a `<style>` tag in your HTML shell.

### How It Works

1. The Vite plugin uses a `transform` hook to automatically swap the JSX runtime to `@veloz/ssr/jsx-runtime` and redirect `@veloz/dom` imports to `@veloz/ssr` during SSR (both builds and `ssrLoadModule` in dev)
2. Components execute once (same as client) but produce HTML strings instead of DOM nodes
3. Reactive values (signals, memos) are read once for their current value
4. CSS generated by `css`, `styled`, and `css` prop is collected server-side and persisted across requests (Vite caches SSR modules, so CSS collection survives between renders)
5. Hydration markers (`data-hk`) are embedded so the client can reuse existing DOM
6. On hydration, control flow components (`Show`, `For`) skip DOM creation and reuse server-rendered elements, wiring up reactivity in place
7. Client-side CSS automatically detects `<style data-veloz-css>` from the server, preventing flash of unstyled content (FOUC)

## API Reference

### Reactive Primitives

```typescript
// Create a reactive signal
const [count, setCount] = createSignal(0);
count();            // read: 0
setCount(5);        // write: 5
setCount(c => c+1); // write with function: 6

// Create a computed/derived value
const doubled = createMemo(() => count() * 2);
doubled(); // always in sync with count

// Create a reactive side effect
createEffect(() => {
  console.log('Count is:', count());
  // Automatically re-runs when count changes
});
```

### Control Flow Components

All control flow components are **hydration-aware**: during SSR hydration, `Show` and `For` reuse existing server-rendered DOM elements instead of re-creating them, wiring up reactive effects in place for a seamless transition.

```tsx
// Conditional rendering
<Show when={() => isLoggedIn()} fallback={<LoginPage />}>
  <Dashboard />
</Show>

// List rendering
<For each={() => todos()}>
  {(todo) => <TodoItem todo={todo} />}
</For>

// Pattern matching
<Switch fallback={<NotFound />}>
  <Match when={() => route() === 'home'}><Home /></Match>
  <Match when={() => route() === 'about'}><About /></Match>
</Switch>

// Render in a different DOM location
<Portal mount={document.body}>
  <Modal />
</Portal>

// Error handling
<ErrorBoundary fallback={(err, reset) => <ErrorPage error={err} retry={reset} />}>
  <App />
</ErrorBoundary>
```

### Lifecycle & Context

```typescript
// Run after mount
onMount(() => {
  console.log('Component mounted');
});

// Cleanup on unmount or re-run
createEffect(() => {
  const timer = setInterval(() => tick(), 1000);
  onCleanup(() => clearInterval(timer));
});

// Context (dependency injection)
const ThemeCtx = createContext('light');

// Provider
<ThemeCtx.Provider value="dark">
  <App />
</ThemeCtx.Provider>

// Consumer
const theme = useContext(ThemeCtx); // 'dark'
```

### Batching & Control

```typescript
// Batch multiple updates into one flush
batch(() => {
  setName('Jane');
  setAge(25);
  // Effects run once after batch, not twice
});

// Read signals without tracking
const value = untrack(() => count());

// Explicit dependency tracking
createEffect(on(count, (value, prev) => {
  console.log(`Changed from ${prev} to ${value}`);
}, { defer: true }));
```

## Security

Veloz.js is **secure by default** with 7 layers of protection:

1. **Auto-escaping** - All text uses `textContent`, never `innerHTML`
2. **HTML Sanitizer** - Built-in allowlist-based sanitizer for explicit HTML insertion
3. **Attribute validation** - Blocks `javascript:` URLs, string event handlers
4. **Prototype pollution protection** - `Object.create(null)` stores, key validation
5. **CSP compatible** - Zero `eval()`, zero `new Function()`, zero inline scripts
6. **Event delegation via Symbol** - Handlers stored internally, not as DOM attributes
7. **Trusted Types API** - Native integration when available in browser

```tsx
// Safe by default - XSS impossible
<div>{userInput}</div>

// Explicit opt-in for HTML (sanitized automatically)
import { sanitize } from '@veloz/dom';
<div innerHTML={sanitize(rawHtml)} />
```

## Architecture

```
@veloz/core          - Reactive system (signals, effects, memos) - zero DOM dependency
@veloz/dom           - DOM renderer, JSX runtime, built-in components, hydration
@veloz/css           - CSS-in-JS module (css, styled, css prop) with auto-scoping
@veloz/ssr           - Server-side rendering (renderToString, renderToStream, hydration)
vite-plugin-veloz    - Vite integration for JSX transform and SSR
```

## Packages

| Package | Description |
|---------|-------------|
| `@veloz/core` | Reactive primitives (works in Node, Workers, anywhere) |
| `@veloz/dom` | DOM rendering, JSX runtime, components, hydration |
| `@veloz/css` | CSS-in-JS with `css`, `styled`, and `css` prop |
| `@veloz/ssr` | Server-side rendering with CSS collection and hydration |
| `vite-plugin-veloz` | Vite plugin for JSX transform and SSR |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities.

## License

[MIT](LICENSE)
