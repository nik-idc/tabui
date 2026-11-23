/** Strength of an accent. */
export enum AccentType {
  /** Accent, shown as ">". */
  Normal,
  /** Heavy accent, shown as "^". */
  Heavy,
}

/** Raw accent settings; validated by AccentOptions. */
export type AccentOptionsData = {
  /** Accent strength. */
  kind: AccentType;
};

/** Keys allowed in accent option data. */
const ACCENT_OPTION_KEYS = [
  "kind",
] as const satisfies readonly (keyof AccentOptionsData)[];

/** Validated, immutable accent settings copied from input data. */
export class AccentOptions {
  /** Accent strength. */
  readonly kind: AccentType;

  /**
   * Validates and copies accent settings.
   * @throws If the kind is unknown or extra keys are present.
   */
  constructor(options: AccentOptionsData) {
    const hasUnexpectedKey = Object.keys(options).some(
      (k) => !ACCENT_OPTION_KEYS.some((key) => key === k)
    );
    if (hasUnexpectedKey) {
      throw Error("Invalid accent options: unexpected key");
    }
    // A numeric enum also maps member names, so allow only numeric keys.
    const isKnownKind =
      typeof options.kind === "number" && options.kind in AccentType;
    if (!isKnownKind) {
      throw Error("Invalid accent options: unknown kind");
    }

    this.kind = options.kind;
  }

  /** Returns true when both options have the same kind. */
  public equals(other: AccentOptions): boolean {
    return this.kind === other.kind;
  }
}
