/** Selects the start or end boundary when changing a bar's repeat state. */
export enum BarRepeatStatus {
  Start,
  End,
}

/** Enables or disables one repeat boundary; an end count means total plays (2–32), and a start must omit the count. */
export type BarRepeatStatusChange = {
  /** Boundary to change. */
  status: BarRepeatStatus;
  /** Whether the selected boundary should be present. */
  enabled: boolean;
  /** Total plays at an enabled end boundary; not allowed for a start boundary. */
  repeatCount?: number;
};
