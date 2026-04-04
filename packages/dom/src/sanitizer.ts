export interface SanitizeOptions {
  allowedTags?: Set<string>;
  allowedAttrs?: Set<string>;
}

const DEFAULT_ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'div', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li',
  'ol', 'p', 'pre', 'small', 'span', 'strong', 'sub', 'sup', 'table',
  'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'figure', 'figcaption',
  'details', 'summary', 'mark', 'time', 'article', 'section', 'nav',
  'header', 'footer', 'main', 'aside',
]);

const DEFAULT_ALLOWED_ATTRS = new Set([
  'alt', 'class', 'href', 'id', 'src', 'style', 'title', 'width', 'height',
  'target', 'rel', 'type', 'value', 'placeholder', 'name', 'for',
  'colspan', 'rowspan', 'lang', 'dir', 'role', 'tabindex',
  'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
  'aria-live', 'aria-atomic', 'aria-expanded', 'aria-controls',
  'aria-haspopup', 'aria-selected', 'aria-checked', 'aria-disabled',
]);

const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript):/i;
const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpeg|jpg|webp|svg\+xml);base64,/i;

let velozPolicy: unknown = null;

function getTrustedTypesPolicy(): unknown {
  if (velozPolicy) return velozPolicy;
  if (
    typeof window !== 'undefined' &&
    (window as any).trustedTypes?.createPolicy
  ) {
    velozPolicy = (window as any).trustedTypes.createPolicy('veloz-sanitize', {
      createHTML: (input: string) => input,
    });
  }
  return velozPolicy;
}

function isURLSafe(url: string): boolean {
  const trimmed = url.trim();
  if (SAFE_DATA_IMAGE.test(trimmed)) return true;
  return !DANGEROUS_URL_SCHEMES.test(trimmed);
}

export function sanitize(
  html: string,
  options?: SanitizeOptions
): string {
  const allowedTags = options?.allowedTags ?? DEFAULT_ALLOWED_TAGS;
  const allowedAttrs = options?.allowedAttrs ?? DEFAULT_ALLOWED_ATTRS;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  walkAndSanitize(body, allowedTags, allowedAttrs);

  const result = body.innerHTML;

  const policy = getTrustedTypesPolicy() as any;
  if (policy) {
    return policy.createHTML(result);
  }

  return result;
}

function walkAndSanitize(
  node: Node,
  allowedTags: Set<string>,
  allowedAttrs: Set<string>
): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!allowedTags.has(tag)) {
        el.remove();
        continue;
      }

      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (!allowedAttrs.has(name) && !name.startsWith('aria-') && !name.startsWith('data-')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if ((name === 'href' || name === 'src' || name === 'action') && !isURLSafe(attr.value)) {
          el.setAttribute(attr.name, 'about:blank');
        }
      }

      if (tag === 'a') {
        el.setAttribute('rel', 'noopener noreferrer');
      }

      walkAndSanitize(el, allowedTags, allowedAttrs);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
  }
}
