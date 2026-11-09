import { hydrate } from '@velozjs/dom';
import '@velozjs/css';
import { App } from './App';

hydrate(() => <App />, document.getElementById('app')!);
