import { renderToString } from '@velozjs/ssr';
import { App } from './App';

export function render() {
  return renderToString(() => <App />);
}
