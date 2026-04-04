import { renderToString } from '@veloz/ssr';
import { App } from './App';

export function render() {
  return renderToString(() => <App />);
}
