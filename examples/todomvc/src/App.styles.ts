import { css } from '@velozjs/css';

export const headerArea = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding: 0 0.25rem;
`;

export const logo = css`
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const badge = css`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #a1a1aa;
`;

export const card = css`
  background: #ffffff;
  border-radius: 1.125rem;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

export const inputArea = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 1.125rem;
  border-bottom: 1px solid #f1f1f4;
`;

export const inputField = css`
  flex: 1;
  padding: 0.875rem 0;
  border: none;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 400;
  outline: none;
  background: transparent;
  color: #1e1e2e;
  &::placeholder { color: #c4c4ce; font-weight: 400; }
`;

export const addBtn = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background: #6366f1;
  border: none;
  border-radius: 0.625rem;
  cursor: pointer;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 300;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { background: #4f46e5; transform: scale(1.05); }
  &:active { transform: scale(0.97); }
`;

export const progressTrack = css`
  height: 3px;
  background: #f1f1f4;
`;

export const progressFill = css`
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  border-radius: 0 2px 2px 0;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
`;

export const toggleRow = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.125rem;
  border-bottom: 1px solid #f6f6f8;
`;

export const toggleBtn = css`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 600;
  color: #a1a1aa;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.12s;
  &:hover { color: #6366f1; }
`;

export const countLabel = css`
  font-size: 0.72rem;
  font-weight: 500;
  color: #c4c4ce;
`;

export const list = css`
  list-style: none;
`;

export const emptyWrap = css`
  padding: 3.5rem 2rem;
  text-align: center;
`;

export const emptyIcon = css`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.35;
`;

export const emptyTitle = css`
  font-size: 0.95rem;
  font-weight: 600;
  color: #b0b0be;
  margin-bottom: 0.35rem;
`;

export const emptySub = css`
  font-size: 0.78rem;
  color: #c8c8d4;
`;

export const footerBar = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 1.125rem;
  border-top: 1px solid #f1f1f4;
  background: #fafafc;
`;

export const footerLeft = css`
  font-size: 0.72rem;
  font-weight: 500;
  color: #a1a1aa;
  min-width: 5.5rem;
`;

export const filtersRow = css`
  display: flex;
  gap: 0.125rem;
  background: #f1f1f4;
  border-radius: 0.5rem;
  padding: 0.2rem;
`;

export const filterBtn = css`
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  color: #71717a;
  transition: all 0.15s;
  &:hover { color: #3f3f46; }
`;

export const filterBtnActive = css`
  background: #ffffff !important;
  color: #6366f1 !important;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

export const clearBtn = css`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 500;
  color: #c4c4ce;
  cursor: pointer;
  transition: color 0.12s;
  &:hover { color: #ef4444; }
`;

export const credits = css`
  text-align: center;
  margin-top: 1.75rem;
  font-size: 0.68rem;
  color: #c4c4ce;
  letter-spacing: 0.01em;
`;

export const creditsLink = css`
  color: #a1a1aa;
  font-weight: 600;
  text-decoration: none;
`;
