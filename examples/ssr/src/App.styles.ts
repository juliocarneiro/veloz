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

export const badges = css`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export const badge = css`
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  background: #eef2ff;
  color: #6366f1;
`;

export const badgeGreen = css`
  background: #ecfdf5 !important;
  color: #059669 !important;
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

export const section = css`
  padding: 2rem 1.5rem;
`;

export const sectionTitle = css`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #a1a1aa;
  margin-bottom: 1rem;
`;

export const articleTitle = css`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e1e2e;
  margin-bottom: 0.5rem;
`;

export const articleBody = css`
  font-size: 0.875rem;
  line-height: 1.7;
  color: #52525b;
`;

export const divider = css`
  height: 1px;
  background: #f1f1f4;
`;

export const counterArea = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
`;

export const counterLabel = css`
  font-size: 0.875rem;
  font-weight: 500;
  color: #71717a;
`;

export const counterValue = css`
  font-size: 2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #6366f1;
  min-width: 3rem;
  text-align: center;
`;

export const btnRow = css`
  display: flex;
  gap: 0.375rem;
`;

export const btn = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #ffffff;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #3f3f46;
  cursor: pointer;
  transition: all 0.12s;
  &:hover { background: #fafafc; border-color: #d1d5db; }
  &:active { transform: scale(0.95); }
`;

export const itemList = css`
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const item = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fafafc;
  border-radius: 0.625rem;
  font-size: 0.85rem;
  color: #3f3f46;
`;

export const itemIcon = css`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  border-radius: 0.5rem;
  font-size: 0.9rem;
`;

export const footerBar = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.125rem;
  border-top: 1px solid #f1f1f4;
  background: #fafafc;
  font-size: 0.72rem;
  font-weight: 500;
  color: #c4c4ce;
`;

export const credits = css`
  text-align: center;
  margin-top: 1.75rem;
  font-size: 0.68rem;
  color: #c4c4ce;
  letter-spacing: 0.01em;
`;

export const creditsAccent = css`
  color: #a1a1aa;
  font-weight: 600;
`;
