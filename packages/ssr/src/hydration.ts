let counter = 0;

export function nextHydrationId(): string {
  return String(counter++);
}

export function resetHydrationCounter(): void {
  counter = 0;
}
