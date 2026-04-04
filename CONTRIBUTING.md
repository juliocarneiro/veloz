# Contributing to Veloz.js

Thank you for your interest in contributing to Veloz.js! This document provides guidelines and instructions for contributing.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/veloz.git
cd veloz

# Install dependencies (requires pnpm >= 9)
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build all packages
pnpm build
```

## Project Structure

```
packages/
  core/        - Reactive system (signals, effects, memos)
  dom/         - DOM renderer, JSX runtime, components, hydration
  css/         - CSS-in-JS with auto-scoping
  ssr/         - Server-side rendering and hydration
  vite-plugin/ - Vite integration and SSR config
examples/
  counter/     - Basic counter example
  todomvc/     - TodoMVC example
  ssr/         - SSR with hydration example
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main` for your feature or fix
3. **Write tests** for any new functionality
4. **Run the test suite** to ensure nothing is broken: `pnpm test`
5. **Submit a pull request** with a clear description of the changes

## Guidelines

### Code Style

- TypeScript strict mode is enforced
- Use functional patterns over class-based
- Keep functions small and focused
- No comments that just narrate what the code does

### Testing

- Write unit tests for reactive primitives in `packages/core/__tests__/`
- Write integration tests for DOM operations in `packages/dom/__tests__/`
- Write SSR tests in `packages/ssr/__tests__/` (run in Node.js, no jsdom needed)
- CSS collection and hydration tests live in `packages/ssr/__tests__/css-collection.test.ts`
- Hydration-aware control flow (`Show`, `For`) is covered in `packages/dom/__tests__/`
- Security tests are critical - never remove them

### Commits

- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on a single change

### Security

- Never use `eval()`, `new Function()`, or `document.write()`
- Never use `innerHTML` without the sanitizer
- Always use `textContent` or `createTextNode` for user-provided text
- Run security tests before submitting: `pnpm test`

## Reporting Bugs

Open an issue with:
- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information

## Requesting Features

Open an issue with:
- A clear description of the feature
- Use cases and motivation
- API design proposal (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
