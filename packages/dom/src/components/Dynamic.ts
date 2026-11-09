import { untrack } from '@velozjs/core';
import { createElement } from '../jsx-runtime.js';
import type { JSX } from '../types.js';

export interface DynamicProps {
  /** A tag name (`"h2"`) or a component. */
  component: string | ((props: any) => unknown) | null | undefined | false;
  [key: string]: unknown;
}

/**
 * Renders the given tag or component with the remaining props. To switch it
 * reactively, wrap it: `{() => <Dynamic component={tag()} />}`.
 */
export function Dynamic(props: DynamicProps): JSX.Element {
  const { component, ...rest } = props;
  if (!component) return null;
  return untrack(() => createElement(component, rest)) as JSX.Element;
}
