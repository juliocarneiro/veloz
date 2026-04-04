import { createSignal, createMemo } from '@veloz/core';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export type Filter = 'all' | 'active' | 'completed';

let nextId = 1;

const [todos, setTodos] = createSignal<Todo[]>([]);
const [filter, setFilter] = createSignal<Filter>('all');

const filteredTodos = createMemo(() => {
  const f = filter();
  const items = todos();
  if (f === 'active') return items.filter(t => !t.done);
  if (f === 'completed') return items.filter(t => t.done);
  return items;
});

const remaining = createMemo(() => todos().filter(t => !t.done).length);
const totalCount = createMemo(() => todos().length);

function addTodo(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  setTodos(prev => [...prev, { id: nextId++, text: trimmed, done: false }]);
}

function toggleTodo(id: number): void {
  setTodos(prev =>
    prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
  );
}

function removeTodo(id: number): void {
  setTodos(prev => prev.filter(t => t.id !== id));
}

function clearCompleted(): void {
  setTodos(prev => prev.filter(t => !t.done));
}

function toggleAll(): void {
  setTodos(prev => {
    const allDone = prev.every(t => t.done);
    return prev.map(t => ({ ...t, done: !allDone }));
  });
}

export {
  todos, setTodos,
  filter, setFilter,
  filteredTodos, remaining, totalCount,
  addTodo, toggleTodo, removeTodo, clearCompleted, toggleAll,
};
