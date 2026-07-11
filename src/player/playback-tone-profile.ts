import {
  AcousticGuitarTone,
  BassGuitarTone,
  ElectricGuitarTone,
  InstrumentTone,
} from "@/notation/model";

export type PlaybackToneProfile = {
  attackMultiplier: number;
  gainMultiplier: number;
  oscillatorType: OscillatorType;
  releaseMultiplier: number;
};

const defaultToneProfile: PlaybackToneProfile = {
  attackMultiplier: 1,
  gainMultiplier: 1,
  oscillatorType: "sine",
  releaseMultiplier: 1,
};

const toneProfiles: Partial<Record<InstrumentTone, PlaybackToneProfile>> = {
  [AcousticGuitarTone.Nylon]: {
    attackMultiplier: 1.25,
    gainMultiplier: 0.95,
    oscillatorType: "triangle",
    releaseMultiplier: 1.15,
  },
  [AcousticGuitarTone.Steel]: {
    attackMultiplier: 0.95,
    gainMultiplier: 1,
    oscillatorType: "triangle",
    releaseMultiplier: 1,
  },
  [BassGuitarTone.Acoustic]: {
    attackMultiplier: 1.15,
    gainMultiplier: 1.08,
    oscillatorType: "triangle",
    releaseMultiplier: 1.35,
  },
  [BassGuitarTone.Clean]: {
    attackMultiplier: 1.05,
    gainMultiplier: 1.08,
    oscillatorType: "triangle",
    releaseMultiplier: 1.25,
  },
  [BassGuitarTone.Distortion]: {
    attackMultiplier: 0.85,
    gainMultiplier: 0.95,
    oscillatorType: "sawtooth",
    releaseMultiplier: 1.1,
  },
  [ElectricGuitarTone.Clean]: defaultToneProfile,
  [ElectricGuitarTone.Overdrive]: {
    attackMultiplier: 0.9,
    gainMultiplier: 0.95,
    oscillatorType: "sawtooth",
    releaseMultiplier: 1.1,
  },
  [ElectricGuitarTone.Distortion]: {
    attackMultiplier: 0.85,
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
