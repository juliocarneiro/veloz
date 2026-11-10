# __PROJECT_NAME__

A [Veloz](https://veloz-site.vercel.app) app.

| Command | |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | type-check and build to `dist/` |
| `npm run preview` | serve the build locally |

```
src/
  main.tsx          renders <App /> into #app
  App.tsx           the page
  components/       Counter, Logo
  styles/global.css
public/             files served as-is (favicon)
index.html          the HTML shell
vite.config.ts      Vite + vite-plugin-veloz
```

Start in `src/App.tsx`. Docs: https://veloz-site.vercel.app/docs/getting-started/
