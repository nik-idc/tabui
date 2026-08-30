export enum BarRepeatStatus {
  Start,
  End,
}

/** Desired state for one repeat status. */
export type BarRepeatStatusChange = {
  status: BarRepeatStatus;
  enabled: boolean;
  repeatCount?: number;
};
