export { css, scopeCSS } from './css.js';
export { styled, setElementFactory } from './styled.js';
export type { StyledComponent } from './styled.js';
export { processCssProp, initCssProp } from './css-prop.js';
export { hash } from './hash.js';
export { insertCSS, hasStyle, clearStyles, getSSRStyles, resetSSRStyles } from './sheet.js';
export { objectToCSS, objectToScopedCSS } from './object-to-css.js';

import { initCssProp } from './css-prop.js';

// Side effect: enables the `css={{...}}` prop on elements.
initCssProp();
