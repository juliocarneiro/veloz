# __PROJECT_NAME__

A [Veloz](https://veloz-site.vercel.app) app with server rendering.

| Command | |
| --- | --- |
| `npm run dev` | dev server: every page rendered on the server, reloads when you save |
| `npm run build` | type-check, then build the client and the server bundle to `dist/` |
| `npm start` | serve the build (`PORT` sets the port, default 3000) |

```
src/
  entry-server.tsx  renderToStringAsync: waits for createResource data, then sends the page
  entry-client.tsx  hydrate: attaches to the server HTML and reuses that data
  App.tsx           the page
  components/       Counter, Logo, Quote (async data with Suspense)
  lib/quotes.ts     the data source; swap it for fetch() to your API
  styles/global.css
server/index.js     Node server: Vite in dev, the built files in production
public/             files served as-is (favicon)
index.html          the HTML shell
vite.config.ts      Vite + vite-plugin-veloz
```

Docs: https://veloz-site.vercel.app/docs/ssr/
