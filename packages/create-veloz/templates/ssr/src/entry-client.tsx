import { hydrate } from '@velozjs/dom';
import { App } from './App';

hydrate(() => <App />, document.getElementById('app')!);
