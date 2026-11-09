import { renderToString } from './render-to-string.js';

const CHUNK_SIZE = 16 * 1024;

/**
 * Renders `fn()` and returns a byte stream (`<style>` first, then the HTML),
 * usable directly as a `Response` body. Rendering itself is synchronous;
 * this does not stream async content out of order.
 */
export function renderToStream(fn: () => unknown): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        const { html, css } = renderToString(fn);
        if (css) controller.enqueue(encoder.encode(`<style data-veloz-css>${css}</style>`));
        for (let i = 0; i < html.length; i += CHUNK_SIZE) {
          controller.enqueue(encoder.encode(html.slice(i, i + CHUNK_SIZE)));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
