const VELOZ_EVENTS = Symbol('veloz_events');

const DELEGATED_EVENTS = new Set([
  'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
  'mouseenter', 'mouseleave', 'mouseover', 'mouseout',
  'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout',
  'pointerenter', 'pointerleave', 'pointercancel',
  'touchstart', 'touchend', 'touchmove', 'touchcancel',
  'keydown', 'keyup', 'keypress',
  'input', 'change', 'submit', 'reset', 'focus', 'blur',
  'focusin', 'focusout',
  'contextmenu', 'wheel', 'scroll',
  'dragstart', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop',
  'compositionstart', 'compositionupdate', 'compositionend',
  'select', 'copy', 'cut', 'paste',
]);

const delegatedRoots = new WeakSet<HTMLElement>();

export function setupDelegation(root: HTMLElement): void {
  if (delegatedRoots.has(root)) return;
  delegatedRoots.add(root);

  for (const eventName of DELEGATED_EVENTS) {
    root.addEventListener(eventName, (e) => {
      let node = e.target as HTMLElement | null;
      while (node && node !== root) {
        const handlers = (node as any)[VELOZ_EVENTS];
        const handler = handlers?.[eventName];
        if (typeof handler === 'function') {
          handler(e);
        }
        if (e.cancelBubble) break;
        node = node.parentElement;
      }
    });
  }
}

export function setEventHandler(
  el: HTMLElement,
  eventName: string,
  handler: EventListener | null
): void {
  let handlers = (el as any)[VELOZ_EVENTS];
  if (!handlers) {
    handlers = Object.create(null);
    (el as any)[VELOZ_EVENTS] = handlers;
  }
  handlers[eventName] = handler;
}

export function isDelegatedEvent(name: string): boolean {
  return DELEGATED_EVENTS.has(name);
}
