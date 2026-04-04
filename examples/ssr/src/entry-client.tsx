import { hydrate } from '@veloz/dom';
import '@veloz/css';
import { App } from './App';

hydrate(() => <App />, document.getElementById('app')!);
