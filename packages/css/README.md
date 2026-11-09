# @velozjs/css

Scoped CSS-in-JS for Veloz: `css` tagged templates, `styled()` components and the `css` prop. Styles go to a constructable stylesheet (CSP-friendly), are deduplicated by content hash, and are collected during SSR.

```bash
npm install @velozjs/css
```

```tsx
import { css, styled } from '@velozjs/css'; // importing also enables the css prop

const card = css`
  padding: 1rem;
  &:hover { background: whitesmoke; }
`;

const Button = styled('button')`
  color: ${(p: { danger?: boolean }) => (p.danger ? 'crimson' : 'inherit')};
`;

<div class={card} css={{ display: 'flex', '@media (min-width: 40em)': { gap: '1rem' } }}>
  <Button danger>Delete</Button>
</div>;
```

Documentation and the other packages: [github.com/juliocarneiro/veloz](https://github.com/juliocarneiro/veloz). MIT license.
