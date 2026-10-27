import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  InstrumentTone,
} from "../notation/model";

export type PlaybackToneProfile = {
  attackMultiplier: number;
  /** Low-pass cutoff multiplier for the short dead-note strike. */
  deadNoteBrightnessMultiplier: number;
  /** Waveshaper drive for dead notes; one means no added grit. */
  deadNoteDrive: number;
  /** Relative dead-note peak level for the instrument's envelope. */
  deadNoteGainMultiplier: number;
  gainMultiplier: number;
  oscillatorType: OscillatorType;
  releaseMultiplier: number;
};

const defaultToneProfile: PlaybackToneProfile = {
  attackMultiplier: 1,
  deadNoteBrightnessMultiplier: 8,
  deadNoteDrive: 1,
  deadNoteGainMultiplier: 1,
  gainMultiplier: 1,
  oscillatorType: "sine",
  releaseMultiplier: 1,
};

const toneProfiles: Partial<Record<InstrumentTone, PlaybackToneProfile>> = {
  [AcousticGuitarTone.Nylon]: {
    attackMultiplier: 1.25,
    deadNoteBrightnessMultiplier: 6,
    deadNoteDrive: 1.05,
    deadNoteGainMultiplier: 0.9,
    gainMultiplier: 0.95,
    oscillatorType: "triangle",
    releaseMultiplier: 1.15,
  },
  [AcousticGuitarTone.Steel]: {
    attackMultiplier: 0.95,
    deadNoteBrightnessMultiplier: 9,
    deadNoteDrive: 1.1,
    deadNoteGainMultiplier: 1,
    gainMultiplier: 1,
    oscillatorType: "triangle",
    releaseMultiplier: 1,
  },
  [BassGuitarTone.Acoustic]: {
    attackMultiplier: 1.15,
    deadNoteBrightnessMultiplier: 4,
    deadNoteDrive: 1.2,
    deadNoteGainMultiplier: 0.95,
    gainMultiplier: 1.08,
    oscillatorType: "triangle",
    releaseMultiplier: 1.35,
  },
  [BassGuitarTone.Clean]: {
    attackMultiplier: 1.05,
    deadNoteBrightnessMultiplier: 4.5,
    deadNoteDrive: 1.2,
    deadNoteGainMultiplier: 1,
    gainMultiplier: 1.08,
    oscillatorType: "triangle",
    releaseMultiplier: 1.25,
  },
  [BassGuitarTone.Distortion]: {
    attackMultiplier: 0.85,
    deadNoteBrightnessMultiplier: 6,
    deadNoteDrive: 4,
    deadNoteGainMultiplier: 0.95,
    gainMultiplier: 0.95,
    oscillatorType: "sawtooth",
    releaseMultiplier: 1.1,
  },
  [ElectricGuitarTone.Clean]: defaultToneProfile,
  [ElectricGuitarTone.Overdrive]: {
    attackMultiplier: 0.9,
    deadNoteBrightnessMultiplier: 10,
    deadNoteDrive: 2.5,
    deadNoteGainMultiplier: 1,
    gainMultiplier: 0.95,
    oscillatorType: "sawtooth",
    releaseMultiplier: 1.1,
  },
  [ElectricGuitarTone.Distortion]: {
    attackMultiplier: 0.85,
    deadNoteBrightnessMultiplier: 12,
    deadNoteDrive: 5,
    deadNoteGainMultiplier: 1,
    gainMultiplier: 0.9,
    oscillatorType: "sawtooth",
    releaseMultiplier: 1.2,
  },
};

export function getPlaybackToneProfile(
  tone: InstrumentTone
): PlaybackToneProfile {
  return toneProfiles[tone] ?? defaultToneProfile;
}
