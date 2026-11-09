# create-veloz

Start a [Veloz](https://veloz-site.vercel.app) app in one command.

[Documentation](https://veloz-site.vercel.app) · [GitHub](https://github.com/juliocarneiro/veloz)

```bash
npm create veloz@latest
```

```bash
pnpm create veloz
yarn create veloz
bun create veloz
```

It asks for a project name and a template, installs the dependencies and prints the command to start. The project comes with Vite, TypeScript and the Veloz plugin already set up.

## Templates

| Template | What you get |
| --- | --- |
| `app` | Single-page app with Vite: `npm run dev`, `npm run build`, `npm run preview`. |
| `ssr` | Server rendering with hydration and async data (`createResource` + `renderToStringAsync`), and a Node server for dev and production: `npm run dev`, `npm run build`, `npm start`. |

## Without prompts

```bash
npm create veloz@latest my-app -- --template ssr --install
```

| Option | |
| --- | --- |
| `[dir]` | project folder (default `veloz-app`) |
| `-t, --template <name>` | `app` or `ssr` (default `app`) |
| `--install` / `--no-install` | install dependencies without asking, or skip it |
| `-h, --help` | show the options |

With npm, options go after `--`. Outside an interactive terminal (CI, scripts) it never asks: it uses the defaults and skips the install unless `--install` is passed. The folder must be empty or not exist yet.

Requires Node 20.19+.
