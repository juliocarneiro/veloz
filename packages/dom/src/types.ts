/** Anything a component may return or JSX may contain. */
export type VelozElement =
  | Node
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly VelozElement[]
  | (() => unknown)
  | { readonly [key: symbol]: unknown };
export type VelozNode = VelozElement;
/** A renderable value that is not a function (lets a render-function child be typed). */
export type StaticElement = Exclude<VelozElement, (...args: any[]) => any>;
export type VelozChild = VelozElement;
export type VelozComponent<P = {}> = (props: P) => VelozElement;

/** A value, or a function returning it (applied reactively). */
type MaybeFn<T> = T | (() => T);

/** An event whose `currentTarget` is the element the handler is on. */
export type TargetedEvent<T extends EventTarget, E extends Event = Event> = Omit<E, 'currentTarget'> & {
  readonly currentTarget: T;
};
export type EventHandler<T extends EventTarget, E extends Event = Event> = (event: TargetedEvent<T, E>) => void;

export type Ref<T> = ((el: T) => void) | { current: T | null };

type EventMap = HTMLElementEventMap & SVGElementEventMap;

/** `onClick`, `onKeydown`, `onPointerdown`... for every DOM event. */
type LowerEventProps<T extends EventTarget> = {
  [K in keyof EventMap as `on${Capitalize<K & string>}`]?: EventHandler<T, EventMap[K]>;
};

/** The camelCase spellings (`onMouseDown`, `onKeyUp`...) map to the same events. */
type CamelEventProps<T extends EventTarget> = {
  onDblClick?: EventHandler<T, MouseEvent>;
  onMouseDown?: EventHandler<T, MouseEvent>;
  onMouseUp?: EventHandler<T, MouseEvent>;
  onMouseMove?: EventHandler<T, MouseEvent>;
  onMouseEnter?: EventHandler<T, MouseEvent>;
  onMouseLeave?: EventHandler<T, MouseEvent>;
  onMouseOver?: EventHandler<T, MouseEvent>;
  onMouseOut?: EventHandler<T, MouseEvent>;
  onContextMenu?: EventHandler<T, MouseEvent>;
  onPointerDown?: EventHandler<T, PointerEvent>;
  onPointerUp?: EventHandler<T, PointerEvent>;
  onPointerMove?: EventHandler<T, PointerEvent>;
  onPointerEnter?: EventHandler<T, PointerEvent>;
  onPointerLeave?: EventHandler<T, PointerEvent>;
  onPointerOver?: EventHandler<T, PointerEvent>;
  onPointerOut?: EventHandler<T, PointerEvent>;
  onPointerCancel?: EventHandler<T, PointerEvent>;
  onKeyDown?: EventHandler<T, KeyboardEvent>;
  onKeyUp?: EventHandler<T, KeyboardEvent>;
  onKeyPress?: EventHandler<T, KeyboardEvent>;
  onFocusIn?: EventHandler<T, FocusEvent>;
  onFocusOut?: EventHandler<T, FocusEvent>;
  onBeforeInput?: EventHandler<T, InputEvent>;
  onTouchStart?: EventHandler<T, TouchEvent>;
  onTouchEnd?: EventHandler<T, TouchEvent>;
  onTouchMove?: EventHandler<T, TouchEvent>;
  onTouchCancel?: EventHandler<T, TouchEvent>;
  onDragStart?: EventHandler<T, DragEvent>;
  onDragEnd?: EventHandler<T, DragEvent>;
  onDragEnter?: EventHandler<T, DragEvent>;
  onDragLeave?: EventHandler<T, DragEvent>;
  onDragOver?: EventHandler<T, DragEvent>;
  onAnimationStart?: EventHandler<T, AnimationEvent>;
  onAnimationEnd?: EventHandler<T, AnimationEvent>;
  onAnimationIteration?: EventHandler<T, AnimationEvent>;
  onTransitionStart?: EventHandler<T, TransitionEvent>;
  onTransitionEnd?: EventHandler<T, TransitionEvent>;
  onTransitionRun?: EventHandler<T, TransitionEvent>;
  onTransitionCancel?: EventHandler<T, TransitionEvent>;
  onCompositionStart?: EventHandler<T, CompositionEvent>;
  onCompositionUpdate?: EventHandler<T, CompositionEvent>;
  onCompositionEnd?: EventHandler<T, CompositionEvent>;
  onLostPointerCapture?: EventHandler<T, PointerEvent>;
  onGotPointerCapture?: EventHandler<T, PointerEvent>;
};

type ClassValue = string | Record<string, unknown> | readonly (string | false | null | undefined)[] | null | undefined;
type StyleValue = string | Record<string, string | number | null | undefined | false> | null | undefined;

/** Attributes shared by every element. Every value may also be an accessor. */
export interface DOMAttributes<T extends Element> extends LowerEventProps<T>, CamelEventProps<T> {
  children?: unknown;
  ref?: Ref<T>;
  key?: string | number;
  /** Scoped style object (requires `import '@velozjs/css'`). */
  css?: Record<string, unknown>;
  /** Sanitized before it is set. Not printed by SSR. */
  innerHTML?: MaybeFn<string | null | undefined>;
  textContent?: MaybeFn<string | number | null | undefined>;

  class?: MaybeFn<ClassValue>;
  className?: MaybeFn<ClassValue>;
  classList?: MaybeFn<Record<string, unknown> | null | undefined>;
  style?: MaybeFn<StyleValue>;
  id?: MaybeFn<string | undefined>;
  title?: MaybeFn<string | undefined>;
  lang?: MaybeFn<string | undefined>;
  dir?: MaybeFn<'ltr' | 'rtl' | 'auto' | undefined>;
  hidden?: MaybeFn<boolean | 'until-found' | undefined>;
  inert?: MaybeFn<boolean | undefined>;
  tabindex?: MaybeFn<number | string | undefined>;
  tabIndex?: MaybeFn<number | undefined>;
  role?: MaybeFn<string | undefined>;
  slot?: MaybeFn<string | undefined>;
  part?: MaybeFn<string | undefined>;
  draggable?: MaybeFn<boolean | 'true' | 'false' | undefined>;
  spellcheck?: MaybeFn<boolean | 'true' | 'false' | undefined>;
  contenteditable?: MaybeFn<boolean | 'true' | 'false' | 'plaintext-only' | undefined>;
  translate?: MaybeFn<'yes' | 'no' | undefined>;
  autofocus?: MaybeFn<boolean | undefined>;
  accesskey?: MaybeFn<string | undefined>;
  enterkeyhint?: MaybeFn<string | undefined>;
  inputmode?: MaybeFn<string | undefined>;
  popover?: MaybeFn<boolean | 'auto' | 'manual' | 'hint' | '' | undefined>;
  popovertarget?: MaybeFn<string | undefined>;
  popovertargetaction?: MaybeFn<'show' | 'hide' | 'toggle' | undefined>;
  command?: MaybeFn<string | undefined>;
  commandfor?: MaybeFn<string | undefined>;
  is?: string;

  [attr: `data-${string}`]: MaybeFn<string | number | boolean | null | undefined>;
  [attr: `aria-${string}`]: MaybeFn<string | number | boolean | null | undefined>;
  /** Any other attribute (custom elements, rare or new attributes). */
  [attr: string]: unknown;
}

type A<T> = MaybeFn<T | undefined>;

interface FormControl {
  name?: A<string>;
  disabled?: A<boolean>;
  form?: A<string>;
  required?: A<boolean>;
  autocomplete?: A<string>;
}

interface ElementAttributes {
  a: { href?: A<string>; target?: A<string>; rel?: A<string>; download?: A<string | boolean>; hreflang?: A<string>; type?: A<string>; ping?: A<string>; referrerpolicy?: A<string> };
  area: { href?: A<string>; alt?: A<string>; coords?: A<string>; shape?: A<string>; target?: A<string>; rel?: A<string>; download?: A<string | boolean> };
  audio: MediaAttributes;
  video: MediaAttributes & { poster?: A<string>; width?: A<number | string>; height?: A<number | string>; playsinline?: A<boolean> };
  button: FormControl & { type?: A<'button' | 'submit' | 'reset'>; value?: A<string | number>; formaction?: A<string>; popovertarget?: A<string> };
  dialog: { open?: A<boolean>; closedby?: A<'any' | 'closerequest' | 'none'> };
  details: { open?: A<boolean>; name?: A<string> };
  fieldset: { disabled?: A<boolean>; name?: A<string>; form?: A<string> };
  form: { action?: A<string>; method?: A<string>; enctype?: A<string>; novalidate?: A<boolean>; target?: A<string>; autocomplete?: A<string>; name?: A<string> };
  iframe: { src?: A<string>; srcdoc?: A<string>; name?: A<string>; allow?: A<string>; loading?: A<'lazy' | 'eager'>; sandbox?: A<string>; width?: A<number | string>; height?: A<number | string>; referrerpolicy?: A<string> };
  img: { src?: A<string>; srcset?: A<string>; sizes?: A<string>; alt?: A<string>; width?: A<number | string>; height?: A<number | string>; loading?: A<'lazy' | 'eager'>; decoding?: A<'async' | 'sync' | 'auto'>; fetchpriority?: A<'high' | 'low' | 'auto'>; crossorigin?: A<string>; referrerpolicy?: A<string> };
  input: FormControl & {
    type?: A<string>; value?: A<string | number | readonly string[]>; checked?: A<boolean>; indeterminate?: A<boolean>;
    placeholder?: A<string>; readonly?: A<boolean>; min?: A<string | number>; max?: A<string | number>; step?: A<string | number>;
    pattern?: A<string>; maxlength?: A<number>; minlength?: A<number>; multiple?: A<boolean>; accept?: A<string>; list?: A<string>; size?: A<number>;
  };
  label: { for?: A<string>; htmlFor?: A<string> };
  link: { href?: A<string>; rel?: A<string>; as?: A<string>; type?: A<string>; media?: A<string>; crossorigin?: A<string>; integrity?: A<string> };
  meta: { name?: A<string>; content?: A<string>; charset?: A<string>; 'http-equiv'?: A<string>; property?: A<string> };
  meter: { value?: A<number>; min?: A<number>; max?: A<number>; low?: A<number>; high?: A<number>; optimum?: A<number> };
  ol: { start?: A<number>; reversed?: A<boolean>; type?: A<string> };
  optgroup: { label?: A<string>; disabled?: A<boolean> };
  option: { value?: A<string | number>; selected?: A<boolean>; disabled?: A<boolean>; label?: A<string> };
  output: { for?: A<string>; name?: A<string>; form?: A<string> };
  progress: { value?: A<number>; max?: A<number> };
  script: { src?: A<string>; type?: A<string>; async?: A<boolean>; defer?: A<boolean>; nonce?: A<string>; crossorigin?: A<string>; integrity?: A<string> };
  select: FormControl & { value?: A<string | number | readonly string[]>; multiple?: A<boolean>; size?: A<number> };
  slot: { name?: A<string> };
  source: { src?: A<string>; srcset?: A<string>; type?: A<string>; media?: A<string>; sizes?: A<string> };
  style: { media?: A<string>; nonce?: A<string> };
  td: { colspan?: A<number>; rowspan?: A<number>; headers?: A<string> };
  th: { colspan?: A<number>; rowspan?: A<number>; headers?: A<string>; scope?: A<string>; abbr?: A<string> };
  textarea: FormControl & { value?: A<string>; placeholder?: A<string>; readonly?: A<boolean>; rows?: A<number>; cols?: A<number>; maxlength?: A<number>; minlength?: A<number>; wrap?: A<string> };
  time: { datetime?: A<string> };
  track: { src?: A<string>; kind?: A<string>; label?: A<string>; srclang?: A<string>; default?: A<boolean> };
}

interface MediaAttributes {
  src?: A<string>;
  controls?: A<boolean>;
  autoplay?: A<boolean>;
  loop?: A<boolean>;
  muted?: A<boolean>;
  preload?: A<'none' | 'metadata' | 'auto'>;
  crossorigin?: A<string>;
}

/** Common SVG presentation attributes (any other SVG attribute is accepted too). */
interface SVGAttributes {
  viewBox?: A<string>;
  xmlns?: string;
  width?: A<number | string>;
  height?: A<number | string>;
  x?: A<number | string>;
  y?: A<number | string>;
  d?: A<string>;
  fill?: A<string>;
  stroke?: A<string>;
  'stroke-width'?: A<number | string>;
  'stroke-linecap'?: A<string>;
  'stroke-linejoin'?: A<string>;
  transform?: A<string>;
  opacity?: A<number | string>;
  href?: A<string>;
  cx?: A<number | string>;
  cy?: A<number | string>;
  r?: A<number | string>;
  points?: A<string>;
  preserveAspectRatio?: A<string>;
}

type HTMLIntrinsics = {
  [K in keyof HTMLElementTagNameMap]: DOMAttributes<HTMLElementTagNameMap[K]> &
    (K extends keyof ElementAttributes ? ElementAttributes[K] : {});
};

type SVGIntrinsics = {
  [K in Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>]: DOMAttributes<SVGElementTagNameMap[K]> & SVGAttributes;
};

export namespace JSX {
  /** The type of a JSX expression such as `<div />` or `<Show />`. */
  export type Element = StaticElement;
  /** What may be used as a tag: intrinsic names, and components returning anything renderable. */
  export type ElementType = keyof IntrinsicElements | ((props: any) => VelozElement);

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements extends HTMLIntrinsics, SVGIntrinsics {
    /** Custom elements and anything else. */
    [elemName: string]: DOMAttributes<any>;
  }
}
