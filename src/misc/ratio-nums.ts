export function getPitchRatioNums(pitch: number): number[] {
  const wholePart = Math.floor(pitch);
  const remainder = pitch - wholePart;
  let topNum = (remainder * 100) / 25;
  let bottomNum = 4;

  if (topNum % 2 === 0) {
    topNum /= 2;
    bottomNum /= 2;
  }

  return [wholePart, topNum, bottomNum];
}
