import type { Todo } from './store';
import { row, checkbox, label, labelDone, rmBtn } from './TodoItem.styles';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

export function TodoItem(props: TodoItemProps) {
  const { todo, onToggle, onRemove } = props;

  return (
    <li class={row}>
      <input
        type="checkbox"
        class={checkbox}
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      <span class={`${label} ${todo.done ? labelDone : ''}`}>
        {todo.text}
      </span>
      <button
        class={`${rmBtn} todo-rm`}
        onClick={() => onRemove(todo.id)}
        aria-label="Remove"
      >
        &#x2715;
      </button>
    </li>
  );
}
