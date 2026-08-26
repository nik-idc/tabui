export function getPitchRatioNums(pitch: number): [number, number, number] {
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

/** Converts pitch ratio components to compact notation label text. */
export function ratioNumsToChar(ratioNums: [number, number, number]): string {
  const [whole, top, bottom] = ratioNums;

  // Handle the specific "1 -> full" requirement
  // (checking both decimal value or strict tuple representation for 1)
  const value = whole + (bottom > 0 ? top / bottom : 0);
  if (value === 1) {
    return "full";
  }

  // Determine fraction symbol based on numerator/denominator
  let fractionStr = "";
  if (bottom === 4) {
    if (top === 1) fractionStr = "¼";
    else if (top === 2) fractionStr = "½";
    else if (top === 3) fractionStr = "¾";
  } else if (bottom === 2 && top === 1) {
    fractionStr = "½";
  }

  // Format final string
  if (whole === 0) {
    return fractionStr || "0";
  }

  if (fractionStr === "") {
    return whole.toString();
  }

  return `${whole}${fractionStr}`;
}
