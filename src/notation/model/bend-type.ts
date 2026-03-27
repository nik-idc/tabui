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
  [BendType.Bend]: ["type", "bendPitch", "bendDuration"],
  [BendType.BendAndRelease]: [
    "type",
    "bendPitch",
    "releasePitch",
    "bendDuration",
  ],
  [BendType.Hold]: ["type", "holdPitch", "bendDuration"],
  [BendType.Prebend]: ["type", "prebendPitch"],
  [BendType.PrebendAndRelease]: [
    "type",
    "releasePitch",
    "prebendPitch",
    "bendDuration",
  ],
  [BendType.PrebendBend]: ["type", "prebendPitch", "bendPitch", "bendDuration"],
  [BendType.Release]: ["type", "releasePitch", "bendDuration"],
};
