# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report them privately through GitHub: [Security → Report a vulnerability](https://github.com/juliocarneiro/veloz/security/advisories/new).

Include what you found, how to reproduce it, and the impact you expect. You will get an answer within a few days; fixes for confirmed issues ship as patch releases and are credited in the advisory unless you prefer otherwise.

## What Veloz protects against

### Text is never HTML

The DOM renderer inserts text with `createTextNode`, and the SSR renderer escapes `& < > " '` in text and attribute values. Strings in JSX can't create elements.

### `innerHTML` is sanitized

`innerHTML` on an element always goes through `sanitize()`: an allowlist of tags and attributes, no `on*` attributes, no `srcdoc`/`formaction`, unsafe URLs replaced by `about:blank`, and `rel="noopener noreferrer"` on links. When the browser supports Trusted Types, the output is wrapped in a `veloz-sanitize` policy (if the page's CSP doesn't allow that policy name, Veloz falls back to plain strings instead of throwing).

On the server there is no DOM to sanitize with, so SSR does **not** print `innerHTML`; the client sets it, sanitized, during hydration.

### URLs can't run script

`href`, `src`, `action`, `formaction`, `srcset`, `poster`, `xlink:href` and other URL attributes are checked on the client, in the sanitizer and in SSR with one shared function. It first removes the characters browsers ignore when reading a URL scheme (tabs, newlines, control characters, spaces), so `java\tscript:` or `\x01javascript:` are caught. `javascript:` and `vbscript:` are always blocked; `data:` is allowed only for raster images (`png`, `gif`, `jpeg`, `webp`, `avif`, `bmp`) in `src`, `poster` and `srcset`. A rejected value removes the attribute instead of leaving an older one in place.

### Attribute names can't inject markup

Names with spaces, quotes, `=`, `>` or other characters outside `[A-Za-z_:][-A-Za-z0-9_:.]*` are rejected, both in the browser and in SSR. Tag names are validated in SSR too. This matters when props are spread from data you don't control.

### Event handlers are functions

String handlers (`onclick="..."`) are rejected. Handlers are stored on a private symbol, never written as attributes, and SSR never prints `on*` props.

### Prototype pollution

Internal maps use `Object.create(null)`, and `validateKey()` rejects `__proto__`, `constructor` and `prototype` for code that builds objects from user input.

### Content Security Policy

No `eval`, `new Function`, `document.write` or inline scripts. Runtime styles go to a constructable stylesheet (`adoptedStyleSheets`), falling back to a single `<style data-veloz-css>` element. Server CSS escapes `</style` so a style value can't close the tag.

## Your responsibilities

- Don't pass untrusted strings to `innerHTML` and expect them to keep markup the sanitizer removes; extend `sanitize()` options deliberately.
- URL checks block script execution, not open redirects: validate destinations that come from users.
- Style values from users can still change how your page looks; don't put untrusted input in `css` / `style` without validation.
