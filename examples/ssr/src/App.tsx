import { createSignal } from '@velozjs/core';
import { Show, For } from '@velozjs/dom';
import {
  headerArea, logo, badges, badge, badgeGreen, card, section, sectionTitle,
  articleTitle, articleBody, divider, counterArea, counterLabel, counterValue,
  btnRow, btn, itemList, item, itemIcon, footerBar, credits, creditsAccent,
} from './App.styles';

const features = [
  { icon: '\u26A1', label: 'Fine-grained reactivity with Signals' },
  { icon: '\uD83C\uDFA8', label: 'CSS-in-JS with automatic scoping' },
  { icon: '\uD83D\uDD12', label: 'Secure by default (XSS prevention)' },
  { icon: '\uD83D\uDE80', label: 'Server-side rendered for SEO' },
];

export function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <div class={headerArea}>
        <h1 class={logo}>veloz ssr</h1>
        <div class={badges}>
          <span class={`${badge} ${badgeGreen}`}>SSR</span>
          <span class={badge}>Veloz.js</span>
        </div>
      </div>

      <div class={card}>
        <div class={section}>
          <div class={sectionTitle}>Server-Rendered Content</div>
          <h2 class={articleTitle}>Welcome to Veloz.js SSR</h2>
          <p class={articleBody}>
            This page was rendered on the server using <code>renderToString</code>.
            All CSS was collected during SSR and injected inline -- no flash of
            unstyled content. The client then hydrates the page, attaching event
            handlers and enabling reactivity.
          </p>
        </div>

        <div class={divider}></div>

        <div class={counterArea}>
          <span class={counterLabel}>Interactive counter (hydrated):</span>
          <div class={btnRow}>
            <button class={btn} onClick={() => setCount(c => c - 1)}>-</button>
            <span class={counterValue}>{() => String(count())}</span>
            <button class={btn} onClick={() => setCount(c => c + 1)}>+</button>
          </div>
        </div>

        <div class={divider}></div>

        <div class={section}>
          <div class={sectionTitle}>Features</div>
        </div>
        <div class={itemList}>
          <For each={features}>
            {(feat) => (
              <div class={item}>
                <span class={itemIcon}>{feat.icon}</span>
                <span>{feat.label}</span>
              </div>
            )}
          </For>
        </div>

        <Show when={() => count() !== 0}>
          <div class={divider}></div>
          <div class={section}>
            <p class={articleBody}>
              {() => `Counter is at ${count()} -- this text updates reactively after hydration.`}
            </p>
          </div>
        </Show>

        <div class={footerBar}>Server-side rendered + client hydrated</div>
      </div>

      <p class={credits}>
        Built with <span class={creditsAccent}>Veloz.js</span> SSR
      </p>
    </div>
  );
}
