/** Anything a component may return or JSX may contain. */
export type VelozElement =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly VelozElement[]
  | (() => unknown)
  | { readonly [key: symbol]: unknown };
export type VelozNode = VelozElement;
export type VelozChild = VelozElement;
export type VelozComponent<P = {}> = (props: P) => VelozElement;

type EventHandler<E = Event> = (event: E) => void;
type MaybeFn<T> = T | (() => T);

interface BaseHTMLAttributes {
  children?: unknown;
  class?: MaybeFn<string | Record<string, boolean> | (string | false | null | undefined)[]>;
  className?: MaybeFn<string>;
  id?: string;
  style?: MaybeFn<string | Record<string, string | number | null | undefined>>;
  classList?: MaybeFn<Record<string, boolean>>;
  ref?: ((el: HTMLElement) => void) | { current: HTMLElement | null };
  css?: Record<string, unknown>;
  /** Sanitized before it is set. */
  innerHTML?: MaybeFn<string>;

  tabindex?: number | string;
  title?: string;
  lang?: string;
  dir?: string;
  hidden?: boolean;
  draggable?: boolean;
  spellcheck?: boolean;
  role?: string;

  onClick?: EventHandler<MouseEvent>;
  onDblclick?: EventHandler<MouseEvent>;
  onMousedown?: EventHandler<MouseEvent>;
  onMouseup?: EventHandler<MouseEvent>;
  onMousemove?: EventHandler<MouseEvent>;
  onMouseenter?: EventHandler<MouseEvent>;
  onMouseleave?: EventHandler<MouseEvent>;
  onKeydown?: EventHandler<KeyboardEvent>;
  onKeyup?: EventHandler<KeyboardEvent>;
  onKeypress?: EventHandler<KeyboardEvent>;
  onFocus?: EventHandler<FocusEvent>;
  onBlur?: EventHandler<FocusEvent>;
  onInput?: EventHandler<InputEvent>;
  onChange?: EventHandler<Event>;
  onSubmit?: EventHandler<SubmitEvent>;
  onScroll?: EventHandler<Event>;
  onWheel?: EventHandler<WheelEvent>;
  onContextmenu?: EventHandler<MouseEvent>;
  onTouchstart?: EventHandler<TouchEvent>;
  onTouchmove?: EventHandler<TouchEvent>;
  onTouchend?: EventHandler<TouchEvent>;
  onDragstart?: EventHandler<DragEvent>;
  onDrag?: EventHandler<DragEvent>;
  onDragend?: EventHandler<DragEvent>;
  onDragenter?: EventHandler<DragEvent>;
  onDragleave?: EventHandler<DragEvent>;
  onDragover?: EventHandler<DragEvent>;
  onDrop?: EventHandler<DragEvent>;

  onDblClick?: EventHandler<MouseEvent>;
  onMouseDown?: EventHandler<MouseEvent>;
  onMouseUp?: EventHandler<MouseEvent>;
  onMouseMove?: EventHandler<MouseEvent>;
  onMouseEnter?: EventHandler<MouseEvent>;
  onMouseLeave?: EventHandler<MouseEvent>;
  onMouseOver?: EventHandler<MouseEvent>;
  onMouseOut?: EventHandler<MouseEvent>;
  onPointerDown?: EventHandler<PointerEvent>;
  onPointerUp?: EventHandler<PointerEvent>;
  onPointerMove?: EventHandler<PointerEvent>;
  onPointerEnter?: EventHandler<PointerEvent>;
  onPointerLeave?: EventHandler<PointerEvent>;
  onKeyDown?: EventHandler<KeyboardEvent>;
  onKeyUp?: EventHandler<KeyboardEvent>;
  onFocusIn?: EventHandler<FocusEvent>;
  onFocusOut?: EventHandler<FocusEvent>;
  onContextMenu?: EventHandler<MouseEvent>;
  onTouchStart?: EventHandler<TouchEvent>;
  onTouchMove?: EventHandler<TouchEvent>;
  onTouchEnd?: EventHandler<TouchEvent>;
  onToggle?: EventHandler<Event>;
  onClose?: EventHandler<Event>;
  onLoad?: EventHandler<Event>;
  onError?: EventHandler<Event>;

  [attr: `data-${string}`]: MaybeFn<string | number | boolean | undefined>;
  [attr: `aria-${string}`]: MaybeFn<string | number | boolean | undefined>;
  [attr: `on${string}`]: EventHandler<any> | undefined;
  /** Any other attribute (SVG `d`, `viewBox`, custom elements...). */
  [attr: string]: unknown;
}

interface InputAttributes extends BaseHTMLAttributes {
  type?: string;
  value?: string | number;
  checked?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  maxlength?: number;
  minlength?: number;
  autocomplete?: string;
  autofocus?: boolean;
}

interface AnchorAttributes extends BaseHTMLAttributes {
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
}

interface ImgAttributes extends BaseHTMLAttributes {
  src?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  loading?: 'lazy' | 'eager';
}

interface FormAttributes extends BaseHTMLAttributes {
  action?: string;
  method?: string;
  enctype?: string;
  novalidate?: boolean;
}

interface SelectAttributes extends BaseHTMLAttributes {
  value?: string | number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

interface TextareaAttributes extends BaseHTMLAttributes {
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  maxlength?: number;
}

interface LabelAttributes extends BaseHTMLAttributes {
  for?: string;
}

interface OptionAttributes extends BaseHTMLAttributes {
  value?: string | number;
  selected?: boolean;
  disabled?: boolean;
}

export namespace JSX {
  export type Element = VelozElement;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements {
    input: InputAttributes;
    a: AnchorAttributes;
    img: ImgAttributes;
    form: FormAttributes;
    select: SelectAttributes;
    textarea: TextareaAttributes;
    label: LabelAttributes;
    option: OptionAttributes;
    button: BaseHTMLAttributes & { type?: string; disabled?: boolean; name?: string; value?: string };
    [elemName: string]: BaseHTMLAttributes;
  }
}
