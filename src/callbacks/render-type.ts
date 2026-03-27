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
  /** Selection overlay + UI refresh for single-note selection updates. */
  NoteSelection = "note-selection",
  /** Reserved for future player-cursor-only updates. */
  PlayerCursor = "player-cursor",
}
