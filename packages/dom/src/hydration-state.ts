let hydrating = false;
let hydrationPointer = 0;

export function isHydrating(): boolean {
  return hydrating;
}

export function setHydrating(value: boolean): void {
  hydrating = value;
}

export function nextHydrationNode(): string {
  return String(hydrationPointer++);
}

export function resetHydrationPointer(): void {
  hydrationPointer = 0;
}
