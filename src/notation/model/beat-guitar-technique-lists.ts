import { BeatGuitarTechniqueType } from "./beat-technique-type";

/** Beat techniques that cannot share a beat with each type; each type also excludes itself. */
export const BEAT_TECHNIQUES_INCOMPATIBILITY = {
  [BeatGuitarTechniqueType.Stroke]: [BeatGuitarTechniqueType.Stroke],
} as const satisfies Record<
  BeatGuitarTechniqueType,
  readonly BeatGuitarTechniqueType[]
>;

/** Returns true when two beat technique types cannot share one beat. */
export function beatGuitarTechniquesIncompatible(
  a: BeatGuitarTechniqueType,
  b: BeatGuitarTechniqueType
): boolean {
  // Widen the literal tuples so `includes` accepts any type.
  const incompatibleWithA: readonly BeatGuitarTechniqueType[] =
    BEAT_TECHNIQUES_INCOMPATIBILITY[a];
  const incompatibleWithB: readonly BeatGuitarTechniqueType[] =
    BEAT_TECHNIQUES_INCOMPATIBILITY[b];
  return incompatibleWithA.includes(b) || incompatibleWithB.includes(a);
}
