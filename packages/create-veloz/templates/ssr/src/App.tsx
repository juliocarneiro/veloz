import { Counter } from './Counter';
import { Logo } from './Logo';
import { Quote } from './Quote';

export function App() {
  return (
    <main>
      <Logo />
      <h1>Veloz SSR</h1>
      <p>
        This page was rendered on the server with its data, then hydrated. Edit <code>src/App.tsx</code> and save.
      </p>
      <Quote />
      <Counter />
      <p>
        <a href="https://veloz-site.vercel.app/docs/ssr/">Server rendering docs</a>
      </p>
    </main>
  );
}
