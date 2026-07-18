/**
 * Render modes used by callbacks to choose the minimal render path
 * for a given interaction.
 */
export enum RenderType {
  /** Full notation + callbacks + UI render pipeline. */
  Full = "full",
  /** Notation render only (plus mouse binding) for scroll updates. */
  NotationOnly = "notation-only",
  /** Selection overlay + UI refresh for drag beat-selection updates. */
  DragSelection = "drag-selection",
  /** Immediate selection overlay and selection-dependent UI refresh. */
  SelectionRefresh = "selection-refresh",
  /** Visible notation refresh needed after active voice changes. */
  ActiveVoiceSelection = "active-voice-selection",
  /** Reserved for future player-cursor-only updates. */
  PlayerCursor = "player-cursor",
}
