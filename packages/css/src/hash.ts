const PREFIX = 'v-';

export function hash(str: string): string {
  let h = 5381;
  let i = str.length;
  while (i) {
    h = (h * 33) ^ str.charCodeAt(--i);
  }
  return PREFIX + (h >>> 0).toString(36);
}
