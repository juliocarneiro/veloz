# Contributing to Veloz

Thanks for helping. Bug reports, docs fixes and pull requests are all welcome.

## Setup

Requirements: Node.js 20+ and pnpm 10+ (the repo pins the version in `packageManager`; `corepack enable` picks it up).

```bash
git clone https://github.com/juliocarneiro/veloz.git
cd veloz
pnpm install
pnpm test        # all packages, against the sources
pnpm typecheck
pnpm build
```

Tests run against `packages/*/src` through Vitest aliases, so you don't need to build first.

## Layout

```
packages/
  core/         signals, memos, effects, ownership, context (no DOM)
  dom/          JSX runtime, render, hydrate, control flow, events, sanitizer
  css/          css``, styled(), css prop, SSR style collection
  ssr/          renderToString, renderToStream, server components
  vite-plugin/  JSX config + SSR module resolution
examples/
  todomvc/      client-only app
  ssr/          dev server with SSR + hydration
```

Run an example with `pnpm --dir examples/todomvc dev` or `pnpm --dir examples/ssr dev` (they use the built packages, so run `pnpm build` first).

## Pull requests

1. Branch from `main`.
2. Add a test that fails without your change. Bugs in rendering or hydration usually belong in `packages/dom/__tests__/regressions.test.tsx` or `ssr-hydration.test.ts`.
3. `pnpm typecheck && pnpm test && pnpm build` must pass.
4. Describe the user-facing change; add a line to `CHANGELOG.md` under "Unreleased".

### Guidelines

- TypeScript strict, small functions, comments that explain *why*.
- Keep server and client in step: anything the client renders as a reactive region must be wrapped in region markers by `@velozjs/ssr`, and elements must be created in the same order on both sides (the end-to-end test in `ssr-hydration.test.ts` checks this).
- Security tests are never removed or weakened.
- No `eval`, `new Function`, `document.write`, or `innerHTML` without `sanitize()`.

## Releasing (maintainers)

```bash
pnpm release   # typecheck, test, build, then pnpm publish for every package
```

Use `pnpm publish` (not `npm publish`): it replaces the `workspace:^` ranges with real versions.

## License

By contributing you agree that your contributions are licensed under the MIT License.
