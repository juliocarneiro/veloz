// Compile-only checks for the public types (run with `pnpm typecheck`).
import {
  render, hydrate, createSignal, createMemo, createResource, Show, For, Switch, Match,
  ErrorBoundary, Suspense, Portal, Dynamic, access, type MaybeAccessor, type JSX,
} from '@velozjs/dom';
import { renderToString, renderToStringAsync } from '@velozjs/ssr';
import { css, styled } from '@velozjs/css';

const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('Ada');
const [open, setOpen] = createSignal(false);
const doubled = createMemo(() => count() * 2);

// Refs and events know the element type.
let dialog: HTMLDialogElement | undefined;
const a = <dialog ref={(el) => (dialog = el)} closedby="any" />;
const b = <input value={name()} onInput={(e) => setName(e.currentTarget.value)} checked={() => open()} />;
const c = <button type="submit" disabled={() => count() > 3} onClick={(e) => e.currentTarget.form?.reset()}>+</button>;
const box = { current: null as HTMLDivElement | null };
const d = <div ref={box} onMouseEnter={() => {}} onKeyDown={(e) => e.key} aria-pressed={true} data-x={1} />;

// Reactive attributes, classes and styles.
const e = (
  <p class={() => ['x', open() && 'on']} classList={() => ({ on: open() })} style={() => ({ opacity: open() ? 1 : 0.5, '--w': '1px' })}>
    {count} {doubled} {() => count() + 1} {name()} {null} {false} {[1, 2]}
  </p>
);

// SVG, custom elements, unknown attributes.
const f = (
  <svg viewBox="0 0 24 24" class="icon">
    <path d="M0 0" stroke-width={2} />
    <use href="#x" />
  </svg>
);
const g = <my-widget some-attr="1" />;

// Components.
const Badge = (props: { count: MaybeAccessor<number>; onPick?: (n: number) => void }) => (
  <span onClick={() => props.onPick?.(access(props.count))}>{() => access(props.count)}</span>
);
const h1 = <Badge count={count} onPick={(n) => setCount(n)} />;

const [user] = createResource(() => Promise.resolve({ name: 'Ada' }));
const [post] = createResource(count, async (id) => ({ id, title: 't' }));

const flow = (
  <>
    <Show when={() => user()} fallback={<p>none</p>}>
      {(u) => <p>{u.name}</p>}
    </Show>
    <Show when={open}>
      <p>plain children</p>
    </Show>
    <For each={() => [1, 2, 3]} fallback="empty">
      {(n, i) => <li>{n + i()}</li>}
    </For>
    <Switch fallback="no">
      <Match when={() => count() === 1}>one</Match>
      <Match when={() => post()}>{(p) => <b>{p.title}</b>}</Match>
    </Switch>
    <ErrorBoundary fallback={(err, reset) => <button onClick={reset}>{err.message}</button>}>
      {() => <Badge count={1} />}
    </ErrorBoundary>
    <Suspense fallback={<p>loading</p>}>{() => <p>{() => user()?.name}</p>}</Suspense>
    <Portal mount={document.body}>{() => <div />}</Portal>
    <Dynamic component="h2" class="t">Title</Dynamic>
    <Dynamic component={Badge} count={2} />
  </>
);

const Styled = styled('button')`color: red;`;
const s1 = <Styled class="x" onClick={() => {}} />;
const cls: string = css`color: red;`;
const s2 = <div css={{ color: 'red', '&:hover': { color: 'blue' } }} />;

const el: JSX.Element = flow;
render(() => <Badge count={1} />, document.body);
hydrate(() => <Badge count={1} />, document.body);
const html: string = renderToString(() => <Badge count={1} />).html;
renderToStringAsync(() => <Badge count={1} />, { timeout: 100 }).then((r) => r.script);

// Numeric attributes take a number or a numeric string, as in HTML.
const nums = (
  <>
    <progress value="64" max="100" />
    <progress value={64} max={() => 100} />
    <meter value="0.6" min="0" max="1" low="0.2" high="0.8" optimum="0.5" />
    <textarea rows="4" cols={40} maxlength="200" />
    <input maxlength="10" minlength="2" size="20" />
    <select size="3" />
    <ol start="3" />
    <table><tbody><tr><td colspan="2" rowspan="1" /><th colspan={2} /></tr></tbody></table>
  </>
);

// Things that must not compile.
// @ts-expect-error string handlers are not allowed
const bad1 = <button onClick="alert(1)" />;
// @ts-expect-error ref element type must match
const bad2 = <input ref={(el: HTMLCanvasElement) => el.getContext("2d")} />;
// @ts-expect-error For children must be a function
const bad3 = <For each={[1]}><li /></For>;
// @ts-expect-error numeric attributes reject non-numeric strings
const bad4 = <progress value="lots" />;

export { a, b, c, d, e, f, g, h1, flow, s1, s2, cls, el, html, nums, bad1, bad2, bad3, bad4 };
