/**
 * Build beaming for an irregular tempo
 * @param beatsCount Number of beats in a bar
 * @param duration Duration of a single bar beat
 * @returns
 */
export function buildIrregularBeams(
  beatsCount: number,
  duration: number
): number[] {
  // Adjust beats count and duration to the provided duration
  // (anything below 8 gets multiplied by 8/x: for 4 multiply by 2, for 2 - by 4)
  let adjBeatsCount = beatsCount;
  let adjDuration = duration;
  if (duration < 8) {
    adjBeatsCount *= 8 / duration;
    adjDuration *= 8 / duration;
  }

  // Create all possible counts for when the max num of notes per beam is:
  //
  const counts = [
    [Array(Math.floor(adjBeatsCount / 12)).fill(12), adjBeatsCount % 12],
    [Array(Math.floor(adjBeatsCount / 8)).fill(8), adjBeatsCount % 8],
    [Array(Math.floor(adjBeatsCount / 6)).fill(6), adjBeatsCount % 6],
    [Array(Math.floor(adjBeatsCount / 4)).fill(4), adjBeatsCount % 4],
    [Array(Math.floor(adjBeatsCount / 2)).fill(2), adjBeatsCount % 2],
  ]
    .filter((v) => (v[0] as number[]).length > 0)
    .sort((a, b) => (a[0] as number[]).length - (b[0] as number[]).length);

  let biggestBeamNotesCount = (counts[0][0] as number[])[0];
  const biggestBeamsCount = (counts[0][0] as number[]).length;
  let remainderBeamNotesCount = counts[0][1] as number;

  // Adjust the biggest beam count by moving notes to the remainder beam
  // The goal is:
  // - Keep each beam group reasonably sized (>4 notes difference)
  // - Prefer multiples of 4 when biggestBeamNotesCount > 8
  while (
    biggestBeamNotesCount - remainderBeamNotesCount > 4 &&
    (biggestBeamNotesCount <= 8 || biggestBeamNotesCount % 4 !== 0)
  ) {
    biggestBeamNotesCount -= 2;
    remainderBeamNotesCount += 2;
  }

  const finalBiggsetBeams = Array(biggestBeamsCount).fill(
    biggestBeamNotesCount
  );

  const curBeaming = [...finalBiggsetBeams, remainderBeamNotesCount];
  let pulseBase;
  let pulsesCount;
  if (duration === 2) {
    return curBeaming;
  } else {
    pulseBase = buildIrregularBeams(beatsCount, 2);
    pulsesCount = pulseBase.length;
  }

  const result = Array(pulsesCount).fill(0);
  for (let i = 0; i < pulsesCount; i++) {
    result[i] = pulseBase[i];
  }

  for (let i = 0; i < Math.log2(duration) - 1; i++) {
    for (let j = 0; j < pulsesCount; j++) {
      if (result[j] % 2 !== 0) {
        continue;
      }
      result[j] /= 2;
    }
  }
  result[result.length - 1] -= duration === 4 ? 2 : 0;

  const factor = duration === 4 ? 2 : 1;
  let resultSum = 0;
  for (const el of result) {
    resultSum += el;
  }
  if (resultSum === beatsCount * factor) {
    return result;
  }

  for (let i = result.length - 1; i >= 0; i++) {
    if (resultSum > beatsCount * factor) {
      result[i] -= 1 * factor;
      resultSum -= 1 * factor;
    } else {
      result[i] += 1 * factor;
      resultSum += 1 * factor;
    }

    if (resultSum === beatsCount * factor) {
      return result;
    }
  }

  return result;
}

/**
 * Returns beaming rules for a given time signature.
 * @param beatsCount - top number of the time signature (e.g., 4 in 4/4, 7 in 7/8)
 * @param duration - bottom number of the time signature (e.g., 4 = quarter note, 8 = eighth note)
 * @returns Array of group sizes in "duration" subdivisions (e.g., [2,2,2,2] for 4/4 eighths)
 */
export function getBeaming(beatsCount: number, duration: number) {
  const isSimple = beatsCount === 2 || beatsCount === 3 || beatsCount === 4;
  const isCompound = beatsCount % 3 === 0 && beatsCount !== 3 && duration === 8;
  const isIrregular = !isSimple && !isCompound;

  // Handle irregular meters first
  if (isIrregular) {
    return buildIrregularBeams(beatsCount, duration);
  }

  // Compound meter: top divisible by 3 but not 3 itself (6/8, 9/8, 12/8)
  if (isCompound) {
    // Example: 6/8 → [3,3], 9/8 → [3,3,3]
    const groups = [];
    const groupsCount = beatsCount / 3;
    for (let i = 0; i < groupsCount; i++) {
      groups.push(3);
    }
    return groups;
  }

  // Simple meter: top = 2, 3, or 4
  if (isSimple) {
    // Group by 2 or 4 subdivisions, depending on duration
    // Example: 4/4 (quarter) → [2,2,2,2] eighth notes
    //          3/4 (quarter) → [2,2,2] eighth notes
    const groups = [];
    for (let i = 0; i < beatsCount; i++) {
      groups.push(2); // each beat = 2 subdivisions (eighths)
    }
    return groups;
  }

  // Default fallback: no grouping
  return [beatsCount];
}
