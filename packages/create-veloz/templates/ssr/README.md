# __PROJECT_NAME__

A [Veloz](https://veloz-site.vercel.app) app with server rendering.

| Command | |
| --- | --- |
| `npm run dev` | dev server with hot reload, every page rendered on the server |
| `npm run build` | type-check, then build the client and the server bundle to `dist/` |
| `npm start` | serve the build (`PORT` sets the port, default 3000) |

- `server.js`: renders each request with `src/entry-server.tsx` and serves the built files.
- `src/entry-server.tsx`: `renderToStringAsync` waits for `createResource` data before sending the page.
- `src/entry-client.tsx`: `hydrate` attaches to the server HTML and reuses the data.

Docs: https://veloz-site.vercel.app/docs/ssr/
