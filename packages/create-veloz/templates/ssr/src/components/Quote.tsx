import { createResource, Suspense } from '@velozjs/dom';
import { getQuote } from '../lib/quotes';

export function Quote() {
  // On the server, renderToStringAsync waits for this before sending the page.
  // In the browser, hydrate() starts with the server's value instead of fetching again.
  const [quote, { refetch }] = createResource(getQuote);

  return (
    <section class="card">
      <Suspense fallback={<p>Loading…</p>}>
        {() => (
          <blockquote>
            “{() => quote()?.text}”
            <footer>{() => quote()?.author}</footer>
          </blockquote>
        )}
      </Suspense>
      <div class="row">
        <button onClick={() => refetch()} disabled={() => quote.loading}>
          Another quote
        </button>
      </div>
    </section>
  );
}
