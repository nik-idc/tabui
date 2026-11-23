/**
 * Written loudness of a beat. Values go from softest to loudest, so a higher
 * value is always louder.
 */
export enum Dynamic {
  /** ppp */
  Pianississimo,
  /** pp */
  Pianissimo,
  /** p */
  Piano,
  /** mp */
  MezzoPiano,
  /** mf */
  MezzoForte,
  /** f */
  Forte,
  /** ff */
  Fortissimo,
  /** fff */
  Fortississimo,
}

/** Dynamic of a beat that has nothing to inherit from. */
export const DEFAULT_DYNAMIC = Dynamic.MezzoForte;

/** All dynamics from softest to loudest. */
export const DYNAMICS: readonly Dynamic[] = [
  Dynamic.Pianississimo,
  Dynamic.Pianissimo,
  Dynamic.Piano,
  Dynamic.MezzoPiano,
  Dynamic.MezzoForte,
  Dynamic.Forte,
  Dynamic.Fortissimo,
  Dynamic.Fortississimo,
];

/** Written dynamic marks, such as "mf". */
export const DYNAMIC_SYMBOLS: Record<Dynamic, string> = {
  [Dynamic.Pianississimo]: "ppp",
  [Dynamic.Pianissimo]: "pp",
  [Dynamic.Piano]: "p",
  [Dynamic.MezzoPiano]: "mp",
  [Dynamic.MezzoForte]: "mf",
  [Dynamic.Forte]: "f",
  [Dynamic.Fortissimo]: "ff",
  [Dynamic.Fortississimo]: "fff",
};

/** Spoken dynamic names for tooltips and screen readers. */
export const DYNAMIC_NAMES: Record<Dynamic, string> = {
  [Dynamic.Pianississimo]: "Pianississimo",
  [Dynamic.Pianissimo]: "Pianissimo",
  [Dynamic.Piano]: "Piano",
  [Dynamic.MezzoPiano]: "Mezzo piano",
  [Dynamic.MezzoForte]: "Mezzo forte",
  [Dynamic.Forte]: "Forte",
  [Dynamic.Fortissimo]: "Fortissimo",
  [Dynamic.Fortississimo]: "Fortississimo",
};

/** Direction of a one-level dynamic shift. */
export enum DynamicDirection {
  Softer = -1,
  Louder = 1,
}

/** Returns the dynamic one level softer or louder, staying at ppp and fff. */
export function shiftDynamic(
  dynamic: Dynamic,
  direction: DynamicDirection
): Dynamic {
  const index = DYNAMICS.indexOf(dynamic) + direction;
  return DYNAMICS[Math.max(0, Math.min(DYNAMICS.length - 1, index))];
}
