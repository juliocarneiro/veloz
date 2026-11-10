import { render } from '@velozjs/dom';
import './styles/global.css';
import { App } from './App';

render(() => <App />, document.getElementById('app')!);
