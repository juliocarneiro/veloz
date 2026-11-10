import { describe, it, expect } from 'vitest';
import * as client from '../src/index';
import * as server from '../../ssr/src/index';

const strip = (html: string) => html.replace(/ data-hk="[^"]*"/g, '').replace(/<!--\[-->|<!--\]-->/g, '');

describe('0.1.2: numeric attributes written as strings', () => {
  it('applies them in the browser like the number form', () => {
    const h = client.createElement;
    const root = document.createElement('div');
    client.render(
      () => [
        h('progress', { value: '64', max: '100' }),
        h('meter', { value: '0.6', min: '0', max: '1' }),
        h('textarea', { rows: '4', cols: 40 }),
        h('table', null, h('tbody', null, h('tr', null, h('td', { colspan: '2' })))),
      ],
      root,
    );
    const progress = root.querySelector('progress')!;
    expect(progress.value).toBe(64);
    expect(progress.max).toBe(100);
    expect(root.querySelector('meter')!.value).toBe(0.6);
    expect(root.querySelector('textarea')!.rows).toBe(4);
    expect(root.querySelector('textarea')!.cols).toBe(40);
    expect(root.querySelector('td')!.colSpan).toBe(2);
  });

  it('prints them on the server', () => {
    const { html } = server.renderToString(() => server.createElement('progress', { value: '64', max: '100' }));
    expect(html).toMatch(/<progress[^>]* value="64"[^>]* max="100"/);
  });
});

describe('0.1.2: @velozjs/ssr exports everything @velozjs/dom does', () => {
  // The Vite plugin points @velozjs/dom imports at @velozjs/ssr during SSR, so a
  // missing name there breaks the server bundle even if it is never called.
  it('has the same runtime exports', () => {
    const missing = Object.keys(client).filter((name) => !(name in server));
    expect(missing).toEqual([]);
  });

  it('createElement renders elements, components and children like JSX', () => {
    const h = server.createElement;
    const Greeting = (props: { name: string; children?: unknown }) => h('p', { class: 'greet' }, 'Hi ', props.name, props.children);
    const { html } = server.renderToString(() =>
      h('div', { id: 'root' }, h(Greeting, { name: 'Ada' }, h('b', null, '!')), h('span', null, 'x')),
    );
    expect(strip(html)).toBe('<div id="root"><p class="greet">Hi Ada<b>!</b></p><span>x</span></div>');
  });

  it('hydrates what server createElement rendered', () => {
    const view = (h: typeof client.createElement) => () => h('div', { id: 'app' }, h('button', { type: 'button' }, 'ok'));
    const container = document.createElement('div');
    container.innerHTML = server.renderToString(view(server.createElement as typeof client.createElement)).html;
    const button = container.querySelector('button');
    client.hydrate(view(client.createElement), container);
    expect(container.querySelector('button')).toBe(button);
  });

  it('runs the same security checks on the server', () => {
    expect(server.sanitizeURL(' https://a.dev ')).toBe('https://a.dev');
    expect(server.sanitizeURL('javascript:alert(1)')).toBe('about:blank');
    expect(client.sanitizeURL('javascript:alert(1)')).toBe('about:blank');
    expect(server.validateAttribute('href', 'javascript:alert(1)')).toBe(false);
    expect(server.validateAttribute('onclick', 'alert(1)')).toBe(false);
    expect(server.validateAttribute('bad name', 'x')).toBe(false);
    expect(server.validateAttribute('title', 'ok')).toBe(true);
    expect(server.isExternalURL('https://example.com')).toBe(true);
    expect(server.isExternalURL('//cdn.example.com/x.js')).toBe(true);
    expect(server.isExternalURL('/docs/')).toBe(false);
  });

  it('DOM-only helpers are harmless to import and say why when called', () => {
    expect(() => server.setupDelegation()).not.toThrow();
    expect(() => server.toNodes()).toThrow(/needs the DOM/);
  });
});
