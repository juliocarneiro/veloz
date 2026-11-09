# @velozjs/ssr

Server-side rendering for Veloz. Renders the same components to HTML with hydration markers and collected styles; `hydrate()` from `@velozjs/dom` picks them up on the client.

```bash
npm install @velozjs/ssr
```

```tsx
import { renderToString } from '@velozjs/ssr';

const { html, css } = renderToString(() => <App url={url} />);
// <style data-veloz-css>${css}</style> in <head>, ${html} inside the hydrate() container
```

With async data (`createResource` inside `<Suspense>`), use `renderToStringAsync`: it waits for the data and returns `{ html, css, script }`. Put `script` before your client entry so `hydrate()` reuses the values.

Also: `renderToStream()` (bytes for a `Response`), and server versions of `Show`, `For`, `Switch`/`Match`, `ErrorBoundary`, `Suspense`, `Portal` and `Dynamic`. With [`vite-plugin-veloz`](https://www.npmjs.com/package/vite-plugin-veloz), app imports of `@velozjs/dom` resolve here during SSR automatically.

Documentation and the other packages: [github.com/juliocarneiro/veloz](https://github.com/juliocarneiro/veloz). MIT license.
