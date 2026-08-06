import { Track } from "../notation/model";

export interface MasterAudioBus {
  /** Gain node used for score-wide output volume. */
  gainNode: GainNode;
  /** Panner node used for score-wide stereo output placement. */
  pannerNode: StereoPannerNode;
}

export interface TrackAudioBus {
  /** Track whose audio is routed through this bus. */
  track: Track;
  /** Gain node used for track-level volume/mute/solo state. */
  gainNode: GainNode;
  /** Panner node used for track-level stereo output placement. */
  pannerNode: StereoPannerNode;
}

/**
 * Web Audio nodes created for one scheduled note.
 * This deliberately avoids "voice" terminology so it cannot be confused with
 * TabUI's musical voice model.
 */
export interface ScheduledAudioNode {
  /** One-shot note source node. */
  sourceNode: AudioScheduledSourceNode;
  /** Track that owns the scheduled note. */
  track: Track;
  /** Gain node used only for the note envelope. */
  gainNode: GainNode;
  /** Absolute audio context time when the source is scheduled to start. */
  startTime: number;
}
