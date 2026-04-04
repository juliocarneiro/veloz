import { Show, For } from '@veloz/dom';
import { createMemo, createEffect } from '@veloz/core';
import { TodoItem } from './TodoItem';
import {
  filteredTodos, remaining, totalCount, filter, setFilter,
  addTodo, toggleTodo, removeTodo, clearCompleted, toggleAll, todos,
} from './store';
import type { Filter } from './store';
import {
  headerArea, logo, badge, card, inputArea, inputField, addBtn,
  progressTrack, progressFill, toggleRow, toggleBtn, countLabel,
  list, emptyWrap, emptyIcon, emptyTitle, emptySub,
  footerBar, footerLeft, filtersRow, filterBtn, filterBtnActive,
  clearBtn, credits, creditsLink,
} from './App.styles';

export function App() {
  let inputRef: HTMLInputElement | null = null;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      submit();
    }
  }

  function submit() {
    if (!inputRef) return;
    addTodo(inputRef.value);
    inputRef.value = '';
    inputRef.focus();
  }

  const completedCount = createMemo(() => todos().filter(t => t.done).length);
  const progress = createMemo(() => {
    const total = totalCount();
    if (total === 0) return 0;
    return Math.round((completedCount() / total) * 100);
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
  ];

  return (
    <div>
      <div class={headerArea}>
        <h1 class={logo}>todos</h1>
        <span class={badge}>Veloz.js</span>
      </div>

      <div class={card}>
        <div class={inputArea}>
          <input
            class={inputField}
            placeholder="What needs to be done?"
            onKeydown={handleKeyDown}
            ref={(el: HTMLElement) => { inputRef = el as HTMLInputElement; }}
          />
          <button class={addBtn} onClick={submit}>+</button>
        </div>

        <Show when={() => totalCount() > 0}>
          <div class={progressTrack}>
            <div class={progressFill} ref={(el: HTMLElement) => {
              createEffect(() => { el.style.width = `${progress()}%`; });
            }}></div>
          </div>
        </Show>

        <Show when={() => totalCount() > 0}>
          <div class={toggleRow}>
            <button class={toggleBtn} onClick={toggleAll}>
              &#x2713; Mark all
            </button>
            <span class={countLabel}>
              {() => `${completedCount()} / ${totalCount()} done`}
            </span>
          </div>
        </Show>

        <ul class={list}>
          <For each={() => filteredTodos()} fallback={
            <li class={emptyWrap}>
              <div class={emptyIcon}>&#x1F4DD;</div>
              <div class={emptyTitle}>
                {() => totalCount() === 0
                  ? 'No todos yet'
                  : 'Nothing here'
                }
              </div>
              <div class={emptySub}>
                {() => totalCount() === 0
                  ? 'Type something above and press Enter'
                  : 'Try a different filter'
                }
              </div>
            </li>
          }>
            {(todo) => (
              <TodoItem
                todo={todo}
                onToggle={toggleTodo}
                onRemove={removeTodo}
              />
            )}
          </For>
        </ul>

        <Show when={() => totalCount() > 0}>
          <div class={footerBar}>
            <span class={footerLeft}>
              {() => {
                const r = remaining();
                return `${r} item${r !== 1 ? 's' : ''} left`;
              }}
            </span>
            <div class={filtersRow}>
              {FILTERS.map(f => (
                <button
                  class={() => `${filterBtn} ${filter() === f.key ? filterBtnActive : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Show when={() => completedCount() > 0}>
              <button class={clearBtn} onClick={clearCompleted}>Clear done</button>
            </Show>
          </div>
        </Show>
      </div>

      <p class={credits}>
        Built with <span class={creditsLink}>Veloz.js</span> &mdash; fine-grained reactivity, zero VDOM
      </p>
    </div>
  );
}
