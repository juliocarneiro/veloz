import { URL_ATTRIBUTES, isSafeAttributeURL } from '@velozjs/core';

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

let velozPolicy: unknown = null;
let policyFailed = false;

function getTrustedTypesPolicy(): unknown {
  if (velozPolicy || policyFailed) return velozPolicy;
  const tt = typeof window !== 'undefined' ? (window as any).trustedTypes : undefined;
  if (tt?.createPolicy) {
    try {
      // Only ever fed the output of the sanitizer below.
      velozPolicy = tt.createPolicy('veloz-sanitize', { createHTML: (input: string) => input });
    } catch {
      // The CSP `trusted-types` directive does not allow this policy name.
      policyFailed = true;
    }
  }
  return velozPolicy;
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

        if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') {
          el.removeAttribute(attr.name);
          continue;
        }

        if (!allowedAttrs.has(name) && !name.startsWith('aria-') && !name.startsWith('data-')) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (URL_ATTRIBUTES.has(name) && !isSafeAttributeURL(name, attr.value)) {
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
