export function randomInt(min?: number, max?: number): number {
  if (min === undefined) {
    min = 0;
  }
  if (max === undefined) {
    max = Number.MAX_SAFE_INTEGER;
  }

  min = Math.floor(min);
  max = Math.floor(max);

  return min + Math.floor(Math.random() * (max - min + 1));
}
