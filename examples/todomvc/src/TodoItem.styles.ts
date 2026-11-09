import { css } from '@velozjs/css';

export const row = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.125rem;
  height: 3.25rem;
  border-bottom: 1px solid #f4f4f7;
  transition: background 0.12s;
  &:hover { background: #fafafc; }
  &:hover .todo-rm { opacity: 1; }
  &:last-child { border-bottom: none; }
`;

export const checkbox = css`
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d4d4db;
  border-radius: 0.375rem;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
  &:hover { border-color: #a1a1aa; }
  &:checked {
    background: #6366f1;
    border-color: #6366f1;
  }
  &:checked::after {
    content: '';
    position: absolute;
    left: 3.5px;
    top: 1px;
    width: 5px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

export const label = css`
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.35;
  color: #3f3f46;
  transition: all 0.2s;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const labelDone = css`
  text-decoration: line-through;
  color: #c4c4ce;
`;

export const rmBtn = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  background: none;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #d4d4db;
  font-size: 0.75rem;
  opacity: 0;
  flex-shrink: 0;
  transition: all 0.12s;
  &:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #ef4444;
  }
`;
