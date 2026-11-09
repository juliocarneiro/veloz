# @velozjs/dom

The Veloz DOM renderer: a JSX runtime that creates real DOM nodes, fine-grained updates through signals, control flow components, hydration of server-rendered HTML and built-in XSS protection.

[Documentation](https://veloz-site.vercel.app) · [GitHub](https://github.com/juliocarneiro/veloz)

```bash
npm install @velozjs/dom
```

```json
// tsconfig.json → compilerOptions
{ "jsx": "react-jsx", "jsxImportSource": "@velozjs/dom" }
```

```tsx
import { render, createSignal, Show, For } from '@velozjs/dom';

function App() {
  const [items, setItems] = createSignal(['a', 'b']);
  return (
    <>
      <button onClick={() => setItems([...items(), 'c'])}>Add</button>
      <ul><For each={items}>{(item) => <li>{item}</li>}</For></ul>
      <Show when={() => items().length > 2}><p>Three or more</p></Show>
    </>
  );
}

render(() => <App />, document.getElementById('app')!);
```

Exports `render`, `hydrate`, `Show`, `For`, `Switch`/`Match`, `ErrorBoundary`, `Suspense`, `Portal`, `Dynamic`, `createResource`, `createElement`, `sanitize`, and re-exports the reactive API of `@velozjs/core`. Use [`vite-plugin-veloz`](https://www.npmjs.com/package/vite-plugin-veloz) for Vite projects.

Documentation and the other packages: [github.com/juliocarneiro/veloz](https://github.com/juliocarneiro/veloz). MIT license.
