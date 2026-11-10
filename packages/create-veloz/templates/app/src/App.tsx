import { Counter } from './components/Counter';
import { Logo } from './components/Logo';

export function App() {
  return (
    <main>
      <Logo />
      <h1>Veloz</h1>
      <p>
        Edit <code>src/App.tsx</code> and save to see your changes.
      </p>
      <Counter />
      <p>
        <a href="https://veloz-site.vercel.app/docs/getting-started/">Read the docs</a>
      </p>
    </main>
  );
}
