import { renderToString } from './render-to-string.js';

export function renderToStream(fn: () => string): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      const { html, css } = renderToString(fn);

      if (css) {
        controller.enqueue(`<style data-veloz-css>${css}</style>`);
      }

      controller.enqueue(html);
      controller.close();
    },
  });
}
