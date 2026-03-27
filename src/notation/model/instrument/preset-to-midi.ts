import {
  AcousticGuitarPreset,
  BassGuitarPreset,
  ElectricGuitarPreset,
  MusicInstrumentPreset,
  OtherStringPreset,
} from "./instrument-preset";

export const PRESET_TO_MIDI: Record<MusicInstrumentPreset, number> = {
  [AcousticGuitarPreset.Steel]: 25,
  [AcousticGuitarPreset.Nylon]: 24,
  [ElectricGuitarPreset.Clean]: 27,
  [ElectricGuitarPreset.Overdrive]: 29,
  [ElectricGuitarPreset.Distortion]: 30,
  [BassGuitarPreset.Acoustic]: 32,
  [BassGuitarPreset.Clean]: 33,
  [BassGuitarPreset.Distortion]: 36,
  [OtherStringPreset.Ukulele]: 24, // Kinda wonky, but will do for now
  [OtherStringPreset.Banjo]: 25, // Kinda wonky, but will do for now
} as const;
