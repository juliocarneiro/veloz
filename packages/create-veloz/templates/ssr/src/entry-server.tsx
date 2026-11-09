import { renderToStringAsync } from '@velozjs/ssr';
import { App } from './App';

// Renders the page and waits for its resources (createResource) to load.
export function render(_url: string) {
  return renderToStringAsync(() => <App />, { timeout: 10_000 });
}
