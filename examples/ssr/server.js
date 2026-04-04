import { createServer } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function start() {
  const vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const app = http.createServer(async (req, res) => {
    const url = req.url || '/';

    // Let Vite handle static assets
    if (url.startsWith('/@') || url.startsWith('/src') || url.startsWith('/node_modules')) {
      vite.middlewares(req, res);
      return;
    }

    try {
      let template = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);

      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
      const { html: appHtml, css: appCss } = render();

      const cssTag = appCss
        ? `<style data-veloz-css>${appCss}</style>`
        : '';

      const finalHtml = template
        .replace('<!--ssr-css-->', cssTag)
        .replace('<!--ssr-outlet-->', appHtml);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(e.stack);
    }
  });

  app.listen(3000, () => {
    console.log('Veloz.js - SSR dev server running at http://localhost:3000');
  });
}

start();
