const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_RE = /[&<>"']/g;

export function escapeHTML(str: string): string {
  return str.replace(HTML_RE, (ch) => HTML_ESCAPE[ch]);
}

export function escapeAttr(str: string): string {
  return str.replace(HTML_RE, (ch) => HTML_ESCAPE[ch]);
}
