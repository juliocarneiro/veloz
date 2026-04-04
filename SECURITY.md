# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Veloz.js, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, please email security concerns to: **security@veloz.dev** (or open a private security advisory on GitHub).

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: within 48 hours
- **Assessment**: within 1 week
- **Fix release**: within 2 weeks for critical issues

## Security Model

Veloz.js implements a 7-layer security model:

### Layer 1: XSS Prevention in JSX Runtime
All text content is inserted via `textContent` / `createTextNode`. The JSX runtime **never** uses `innerHTML` for text rendering. This makes XSS through text injection impossible by design.

### Layer 2: Built-in HTML Sanitizer
When developers explicitly need to insert raw HTML, Veloz provides a built-in sanitizer with:
- Allowlist of safe tags (no `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`)
- Allowlist of safe attributes (no `on*` event handlers)
- URL validation (blocks `javascript:`, `data:`, `vbscript:` schemes)
- Automatic `rel="noopener noreferrer"` on links
- Trusted Types API integration

### Layer 3: Attribute Validation
- String event handlers (`onclick="..."`) are blocked - only functions allowed
- URL attributes (`href`, `src`, `action`) are validated against dangerous schemes
- Warnings in development mode for unsafe patterns

### Layer 4: Prototype Pollution Protection
- Internal stores use `Object.create(null)` (no prototype chain)
- Forbidden keys (`__proto__`, `constructor`, `prototype`) are blocked with warnings
- Component props are frozen in development mode

### Layer 5: CSP Compatibility
Veloz.js is fully compatible with strict Content Security Policies:
- Zero use of `eval()` or `new Function()`
- Zero use of `document.write()`
- Zero inline script injection
- Dynamic styles use `element.style.setProperty()` (CSP-safe)

### Layer 6: Secure Event System
- Event delegation uses internal Symbols (not DOM attributes)
- Handlers cannot be injected via HTML attribute manipulation
- Event propagation is controlled internally

### Layer 7: Trusted Types API
When the browser supports Trusted Types (baseline since February 2026), Veloz automatically creates a `veloz-sanitize` policy that wraps all HTML sanitization output in `TrustedHTML` objects.

### Layer 8: SSR Security

Server-side rendering maintains the same security guarantees as client rendering:

- **HTML escaping**: All text content and attribute values are escaped during SSR (`&`, `<`, `>`, `"`, `'`) to prevent XSS in server-rendered HTML
- **No raw interpolation**: The server JSX runtime never interpolates user input directly into HTML -- all values pass through `escapeHTML` or `escapeAttr`
- **Event handlers stripped**: `on*` props are excluded from SSR output (they are attached during client hydration only)
- **URL sanitization**: URL attributes (`href`, `src`, etc.) are validated on the server with the same rules as the client renderer, blocking `javascript:`, `data:`, and `vbscript:` schemes
- **CSS hash isolation**: CSS class names are deterministic hashes, preventing class name collision attacks
- **SSR/client boundary enforcement**: The Vite plugin's `transform` hook ensures that during SSR, JSX and component imports are redirected to the server runtime (`@veloz/ssr`), preventing accidental execution of client DOM APIs on the server
- **CSS hydration safety**: On the client, styles are auto-detected from `<style data-veloz-css>` tags that the server originally generated -- no external CSS is blindly trusted, and no `innerHTML` or `eval` is used

## Dependencies

The `@veloz/core` package has **zero external dependencies**, eliminating supply chain risk for the reactive system.
