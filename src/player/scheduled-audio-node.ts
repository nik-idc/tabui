/**
 * Web Audio nodes created for one scheduled note.
 * This deliberately avoids "voice" terminology so it cannot be confused with
 * TabUI's musical voice model.
 */
export interface ScheduledAudioNode {
  /** One-shot note source node. */
  sourceNode: AudioScheduledSourceNode;
  /** Gain node used for the note envelope. */
  gainNode: GainNode;
}
