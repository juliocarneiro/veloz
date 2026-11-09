const VELOZ_EVENTS = Symbol('veloz_events');

/**
 * Bubbling events are delegated: one listener per event type on the document,
 * so handlers also work inside Portals and multiple roots. Everything else
 * (focus, blur, mouseenter, scroll, load...) gets a listener on the element.
 */
const DELEGATED_EVENTS = new Set([
  'beforeinput', 'click', 'contextmenu', 'dblclick', 'focusin', 'focusout',
  'input', 'keydown', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover',
  'mouseup', 'pointerdown', 'pointermove', 'pointerout', 'pointerover', 'pointerup',
  'touchend', 'touchmove', 'touchstart',
]);

type Handlers = Record<string, EventListener | null>;
type WithHandlers = EventTarget & { [VELOZ_EVENTS]?: Handlers };

const delegatedDocuments = new WeakMap<Document, Set<string>>();
/** Event names already wired for each element. */
const listening = new WeakMap<Element, Set<string>>();

function ensureDelegated(doc: Document, eventName: string): void {
  let names = delegatedDocuments.get(doc);
  if (!names) {
    names = new Set();
    delegatedDocuments.set(doc, names);
  }
  if (names.has(eventName)) return;
  names.add(eventName);
  doc.addEventListener(eventName, dispatchDelegated);
}

const HANDLED = Symbol('veloz_handled');

function dispatchDelegated(e: Event): void {
  // Render roots and the document both listen; handle each event once.
  const marked = e as Event & { [HANDLED]?: boolean };
  if (marked[HANDLED]) return;
  marked[HANDLED] = true;
  const type = e.type;
  let node = (e.composedPath?.()[0] ?? e.target) as Node | null;

  // Expose the element whose handler runs as `currentTarget`, like a native listener.
  Object.defineProperty(e, 'currentTarget', { configurable: true, get: () => node });
  try {
    while (node) {
      const handler = (node as WithHandlers)[VELOZ_EVENTS]?.[type];
      if (typeof handler === 'function') {
        handler.call(node, e);
        if (e.cancelBubble) return;
      }
      node = node.parentNode ?? (node as unknown as ShadowRoot).host ?? null;
    }
  } finally {
    Object.defineProperty(e, 'currentTarget', { configurable: true, value: null });
  }
}

const delegatedRoots = new WeakSet<Node>();

/**
 * Also listens on a render root, so delegated events work in trees that are
 * not attached to the document yet. The document listener covers Portals.
 */
export function setupDelegation(root: Node): void {
  if (delegatedRoots.has(root)) return;
  delegatedRoots.add(root);
  for (const name of DELEGATED_EVENTS) root.addEventListener(name, dispatchDelegated);
}

/** Sets (or clears, with `null`) the handler for `eventName` on `el`. */
export function setEventHandler(el: Element, eventName: string, handler: EventListener | null): void {
  const target = el as WithHandlers;
  let handlers = target[VELOZ_EVENTS];
  if (!handlers) {
    handlers = Object.create(null) as Handlers;
    target[VELOZ_EVENTS] = handlers;
  }
  handlers[eventName] = handler;
  if (handler == null) return;

  let attached = listening.get(el);
  if (!attached) listening.set(el, (attached = new Set()));
  if (attached.has(eventName)) return;
  attached.add(eventName);

  if (DELEGATED_EVENTS.has(eventName)) {
    ensureDelegated(el.ownerDocument, eventName);
  } else {
    // One native listener per event; it calls whatever handler is current.
    el.addEventListener(eventName, (e) => {
      const current = target[VELOZ_EVENTS]?.[eventName];
      if (typeof current === 'function') current.call(el, e);
    });
  }
}

export function isDelegatedEvent(name: string): boolean {
  return DELEGATED_EVENTS.has(name);
}
