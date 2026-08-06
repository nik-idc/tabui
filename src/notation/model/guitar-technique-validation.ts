import { BendTechniqueOptions, MAX_BEND_PITCH } from "./bend-options";
import type { GuitarNote } from "./guitar-note";
import type { GuitarTechnique } from "./guitar-technique";
import {
  BEND_TYPE_INCOMPATIBILITY,
  TECHNIQUES_INCOMPATIBILITY,
} from "./guitar-technique-lists";
import { BendType } from "./bend-type";
import { GuitarTechniqueType } from "./technique-type";

/** Returns whether two technique types are incompatible in either direction. */
export function guitarTechniqueTypesIncompatible(
  existing: GuitarTechniqueType,
  added: GuitarTechniqueType
): boolean {
  return (
    TECHNIQUES_INCOMPATIBILITY[existing].includes(added) ||
    TECHNIQUES_INCOMPATIBILITY[added].includes(existing)
  );
}

/** Returns whether two guitar techniques violate model compatibility rules. */
export function guitarTechniquesIncompatible(
  existing: GuitarTechnique,
  added: GuitarTechnique
): boolean {
  const existingBendTypes =
    existing.bendOptions === null
      ? []
      : BEND_TYPE_INCOMPATIBILITY[existing.bendOptions.type];
  const addedBendTypes =
    added.bendOptions === null
      ? []
      : BEND_TYPE_INCOMPATIBILITY[added.bendOptions.type];
  return (
    guitarTechniqueTypesIncompatible(existing.type, added.type) ||
    existingBendTypes.includes(added.type) ||
    addedBendTypes.includes(existing.type)
  );
}

/** Returns whether bend options fit the note's inherited let-ring pitch. */
export function isBendValidForContinuation(
  note: GuitarNote,
  bendOptions: BendTechniqueOptions
): boolean {
  if (
    bendOptions.type !== BendType.Bend &&
    bendOptions.type !== BendType.BendAndRelease
  ) {
    return true;
  }

  const continuationPitch = note.getBendContinuationPitch();
  if (continuationPitch === undefined) {
    return true;
  }
  if (continuationPitch >= MAX_BEND_PITCH) {
    return false;
  }
  return (
    bendOptions.bendPitch === undefined ||
    bendOptions.bendPitch >= continuationPitch
  );
}
