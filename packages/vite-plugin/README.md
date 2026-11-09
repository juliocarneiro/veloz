# vite-plugin-veloz

Vite plugin for [Veloz](https://github.com/juliocarneiro/veloz): configures JSX for `@velozjs/dom`, and during SSR (dev `ssrLoadModule` and `vite build --ssr`) resolves your app's imports of `@velozjs/dom` to `@velozjs/ssr`, so the same components render to HTML.

```bash
npm install -D vite-plugin-veloz
```

```ts
import { defineConfig } from 'vite';
import veloz from 'vite-plugin-veloz';

export default defineConfig({ plugins: [veloz()] });
```

Option: `exclude`, package names whose imports of `@velozjs/dom` should not be redirected during SSR (packages named `@velozjs/*` are always left alone).

Documentation and the other packages: [github.com/juliocarneiro/veloz](https://github.com/juliocarneiro/veloz). MIT license.
