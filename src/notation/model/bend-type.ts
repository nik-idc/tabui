/**
 * All kinds of bend types
 */
export enum BendType {
  Bend,
  BendAndRelease,
  Hold,
  Prebend,
  PrebendAndRelease,
  PrebendBend,
  Release,
}

/**
 * Options per guitar technique (order matters due to how
 * 'GuitarTechniqueOptions' c-tor works)
 */
export const OPTIONS_PER_BEND_TYPE = {
  [BendType.Bend]: ["bendPitch", "bendDuration"],
  [BendType.BendAndRelease]: ["bendPitch", "releasePitch", "bendDuration"],
  [BendType.Hold]: ["holdPitch", "bendDuration"],
  [BendType.Prebend]: ["prebendPitch"],
  [BendType.PrebendAndRelease]: [
    "releasePitch",
    "prebendPitch",
    "bendDuration",
  ],
  [BendType.PrebendBend]: ["prebendPitch", "bendPitch", "bendDuration"],
  [BendType.Release]: ["releasePitch", "bendDuration"],
};
