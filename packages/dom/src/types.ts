export type VelozNode = Node | Node[] | string | number | boolean | null | undefined;
export type VelozChild = VelozNode | (() => VelozNode);
export type VelozComponent<P = {}> = (props: P) => VelozNode;

type EventHandler<E = Event> = (event: E) => void;

interface BaseHTMLAttributes {
  children?: unknown;
  class?: string | (() => string) | Record<string, boolean>;
  className?: string | (() => string);
  id?: string;
  style?: string | Record<string, string>;
  ref?: ((el: HTMLElement) => void) | { current: HTMLElement | null };
  css?: Record<string, unknown>;
  innerHTML?: string;

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

  [attr: `data-${string}`]: string | undefined;
  [attr: `aria-${string}`]: string | undefined;
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
  export type Element = Node | Node[];

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
