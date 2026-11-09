// Dev: Vite renders each request with hot reload. Prod (--prod): serves the build.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const prod = process.argv.includes('--prod');
const port = Number(process.env.PORT) || 3000;
const root = fileURLToPath(new URL('.', import.meta.url));

const TYPES = {
  '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff2': 'font/woff2', '.txt': 'text/plain',
};

let vite;
let template;
let render;

if (prod) {
  template = readFileSync(join(root, 'dist/client/index.html'), 'utf8');
  ({ render } = await import(new URL('./dist/server/entry-server.js', import.meta.url).href));
} else {
  const { createServer } = await import('vite');
  vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
}

// Files from dist/client. Hashed assets are cached for a year.
function serveStatic(req, res) {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(root, 'dist/client', path);
  if (!file.startsWith(join(root, 'dist/client')) || !existsSync(file) || !statSync(file).isFile()) return false;
  if (path === 'index.html') return false;
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': path.startsWith('assets') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
  createReadStream(file).pipe(res);
  return true;
}

async function renderPage(req, res) {
  const url = req.url ?? '/';
  try {
    let html = template;
    let renderFn = render;
    if (!prod) {
      html = await vite.transformIndexHtml(url, readFileSync(join(root, 'index.html'), 'utf8'));
      ({ render: renderFn } = await vite.ssrLoadModule('/src/entry-server.tsx'));
    }
    const page = await renderFn(url);
    const head = page.css ? `<style data-veloz-css>${page.css}</style>` : '';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    // The data script must come before the client entry, which hydrates with it.
    res.end(html.replace('<!--ssr-head-->', head).replace('<!--ssr-outlet-->', page.html + page.script));
  } catch (err) {
    vite?.ssrFixStacktrace(err);
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(prod ? 'Internal Server Error' : String(err?.stack ?? err));
  }
}

http
  .createServer((req, res) => {
    if (prod) {
      if (!serveStatic(req, res)) renderPage(req, res);
    } else {
      vite.middlewares(req, res, () => renderPage(req, res));
    }
  })
  .listen(port, () => console.log(`${prod ? 'Server' : 'Dev server'} running at http://localhost:${port}`));
